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
    const { order_id, total_dzd, customer_name, customer_email, site_url } = await req.json()

    if (!order_id || !total_dzd) {
      throw new Error('Missing required parameters')
    }

    const chargilySecretKey = Deno.env.get('CHARGILY_SECRET_KEY')
    if (!chargilySecretKey) {
      throw new Error('Chargily Secret Key not configured')
    }

    // Use site_url from body if provided, otherwise fallback to environment variable
    const appUrl = site_url || Deno.env.get('APP_URL') || 'http://localhost:5173'
    const isLive = Deno.env.get('CHARGILY_MODE') === 'live'
    const chargilyUrl = isLive 
      ? 'https://pay.chargily.net/api/v2/checkouts' 
      : 'https://pay.chargily.net/test/api/v2/checkouts'

    console.log(`Creating checkout in ${isLive ? 'LIVE' : 'TEST'} mode...`)

    // Create checkout in Chargily
    const payload: any = {
      amount: total_dzd,
      currency: 'dzd',
      success_url: `${appUrl}/order/success?order_id=${order_id}`,
      failure_url: `${appUrl}/checkout?error=payment_failed`,
      description: `Order ${order_id} from Sahla`,
      metadata: {
        order_id: order_id,
      },
    }

    // Only add webhook if it's a valid remote URL
    const webhookUrl = Deno.env.get('CHARGILY_WEBHOOK_URL')
    if (webhookUrl && !webhookUrl.includes('localhost')) {
      payload.webhook_endpoint = webhookUrl
    }

    const chargilyResponse = await fetch(chargilyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${chargilySecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const chargilyData = await chargilyResponse.json()

    if (!chargilyResponse.ok) {
      console.error('Chargily API Error:', chargilyData)
      throw new Error(chargilyData.message || `Chargily Error: ${chargilyResponse.statusText}`)
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
  } catch (error: any) {
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
