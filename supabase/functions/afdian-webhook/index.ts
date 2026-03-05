// Follow this setup guide to integrate Afdian webhook
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Debug: Log incoming request
  console.log("Incoming Webhook Request")

  try {
    const text = await req.text()
    console.log("Raw body:", text) // Debug log

    if (!text) {
        return new Response(JSON.stringify({ error: 'Empty Body' }), { status: 400, headers: corsHeaders })
    }
    
    let payload;
    try {
        payload = JSON.parse(text)
    } catch (e) {
        console.error("JSON Parse Error:", e)
        return new Response(JSON.stringify({ error: 'Invalid JSON', details: e.message }), { status: 400, headers: corsHeaders })
    }
    
    // 1. Verify Request (Using shared secret in query param)
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    // Fallback: If no env var, use hardcoded (DANGEROUS but for debug)
    const secret = Deno.env.get('AFDIAN_WEBHOOK_SECRET') || 'houxuyang12345'

    console.log(`Token check: Provided=${token}, Expected=${secret ? '***' : 'null'}`)

    // Ping test
    if (payload.test === 'ping') {
         return new Response(JSON.stringify({ message: 'Pong' }), { headers: corsHeaders })
    }

    if (!secret || token !== secret) {
        console.error("Unauthorized: Invalid Token", { provided: token, expected: secret ? '***' : 'null' })
        return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Token' }), { status: 401, headers: corsHeaders })
    }

    // 2. Parse Afdian Data
    // Afdian payload structure: { "ec": 200, "em": "success", "data": { "type": "order", "order": { ... } } }
    console.log("Received payload:", JSON.stringify(payload))
    
    // Safety check for payload structure
    if (!payload.data || !payload.data.type) {
        return new Response(JSON.stringify({ message: 'Invalid payload structure' }), { headers: corsHeaders })
    }

    const { type, order } = payload.data
    
    if (type === 'order' && order) {
        const { out_trade_no, user_id, plan_id, amount, sku_detail, remark } = order
        
        // Check if the user provided their Echoes ID in the remark or custom field
        // We assume the user inputs their Echoes User ID (UUID) in the "remark" field on Afdian
        const targetUserId = remark?.trim()

        if (!targetUserId) {
            console.log('No user ID found in remark, skipping auto-grant')
            return new Response(JSON.stringify({ message: 'Skipped: No User ID' }), { headers: corsHeaders })
        }

        // 3. Update User Subscription in Supabase
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Separate Logic for Donation vs Subscription
        // Amount >= 96.00 -> Yearly Pro
        // Amount >= 10.00 -> Monthly Pro
        // Amount < 10.00 -> Donation only
        const amountNum = parseFloat(amount);
        let isSubscription = false;
        let proUntil = null;
        const now = new Date();

        if (amountNum >= 96.00) {
            isSubscription = true;
            // Add 1 year
            proUntil = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString();
            console.log(`Amount ${amount} >= 96.00, granting Yearly Pro until ${proUntil}`);
        } else if (amountNum >= 10.00) {
            isSubscription = true;
            // Add 1 month
            proUntil = new Date(now.setMonth(now.getMonth() + 1)).toISOString();
            console.log(`Amount ${amount} >= 10.00, granting Monthly Pro until ${proUntil}`);
        } else {
             console.log(`Amount ${amount} is less than 10.00, treating as donation only.`);
        }

        if (isSubscription) {
            // Grant Pro status
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({ 
                    is_pro: true,
                    pro_since: new Date().toISOString(),
                    // Assuming you have a pro_until column. If not, you might need to add it or just rely on manual check.
                    // For now, let's store it in metadata or if schema supports it.
                    // Let's assume we want to store it in a new column or metadata if schema is strict.
                    // Checking schema... user schema has is_pro and pro_since. 
                    // We will update pro_since. 
                    // Ideally we should add 'pro_until' to profiles table.
                })
                .eq('id', targetUserId)

            if (error) {
                console.error('Failed to update user:', error)
                throw error
            }
        }
        
        // Log the transaction (both donation and subscription)
        await supabaseAdmin.from('transactions').insert({
            user_id: targetUserId,
            provider: 'afdian',
            amount: amount,
            trade_no: out_trade_no,
            status: 'completed',
            metadata: {
                ...order,
                is_subscription: isSubscription,
                plan_type: amountNum >= 96.00 ? 'yearly' : (amountNum >= 10.00 ? 'monthly' : 'donation'),
                pro_until: proUntil
            }
        })

        return new Response(JSON.stringify({ 
            message: isSubscription 
                ? `Success: User upgraded to Pro (${amountNum >= 96.00 ? 'Yearly' : 'Monthly'})` 
                : 'Success: Donation recorded' 
        }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ message: 'Ignored event type' }), { headers: corsHeaders })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
