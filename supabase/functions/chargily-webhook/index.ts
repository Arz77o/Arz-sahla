import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const signature = req.headers.get('Signature')
    if (!signature) {
      throw new Error('Missing Signature header')
    }

    const payload = await req.text()
    const secret = Deno.env.get('CHARGILY_WEBHOOK_SECRET')
    if (!secret) {
      throw new Error('Chargily Webhook Secret not configured')
    }

    // Verify signature
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )

    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    )

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      encoder.encode(payload)
    )

    if (!isValid) {
      throw new Error('Invalid signature')
    }

    const event = JSON.parse(payload)

    if (event.type === 'checkout.paid') {
      const orderId = event.data.metadata.order_id
      const chargilyRef = event.data.id

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Update order status
      const { error: updateError } = await supabaseClient
        .from('orders')
        .update({ status: 'paid', chargily_ref: chargilyRef })
        .eq('id', orderId)

      if (updateError) {
        console.error('Failed to update order status:', updateError)
        throw updateError
      }

      // Email logic removed per user request
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Webhook Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
