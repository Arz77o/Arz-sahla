import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { order_id, total_dzd, customer_name, customer_email } = await req.json()

    if (!order_id || !total_dzd) {
      throw new Error('Missing required parameters')
    }

    const chargilySecretKey = Deno.env.get('CHARGILY_SECRET_KEY')
    if (!chargilySecretKey) {
      throw new Error('Chargily Secret Key not configured')
    }

    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'

    // Create checkout in Chargily
    const chargilyResponse = await fetch('https://pay.chargily.net/test/api/v2/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${chargilySecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: total_dzd,
        currency: 'dzd',
        success_url: `${appUrl}/order-success?order_id=${order_id}`,
        failure_url: `${appUrl}/checkout?error=payment_failed`,
        webhook_endpoint: `${appUrl}/api/webhooks/chargily`, // Or your supabase edge function URL
        description: `Order ${order_id} from Sahla`,
        metadata: {
          order_id: order_id,
        },
      }),
    })

    const chargilyData = await chargilyResponse.json()

    if (!chargilyResponse.ok) {
      console.error('Chargily Error:', chargilyData)
      throw new Error(chargilyData.message || 'Failed to create checkout with Chargily')
    }

    // Update order with chargily reference
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({ chargily_ref: chargilyData.id })
      .eq('id', order_id)

    if (updateError) {
      console.error('Failed to update order with chargily ref:', updateError)
      // Continue anyway, we have the checkout URL
    }

    return new Response(
      JSON.stringify({ checkout_url: chargilyData.checkout_url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating checkout:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
