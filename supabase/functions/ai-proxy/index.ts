import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify User
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'No authorization header' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { type, payload } = await req.json()

    // Handle Text Generation (Qwen)
    if (type === 'text') {
      const QWEN_API_KEY = Deno.env.get('QWEN_API_KEY')
      if (!QWEN_API_KEY) throw new Error('QWEN_API_KEY not set')

      const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${QWEN_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } 
    
    // Handle Image Generation (Wanx)
    if (type === 'image') {
      const QWEN_API_KEY = Deno.env.get('QWEN_API_KEY')
      if (!QWEN_API_KEY) throw new Error('QWEN_API_KEY not set')

      // 1. Submit Task
      const submitResponse = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${QWEN_API_KEY}`,
          "Content-Type": "application/json",
          "X-DashScope-Async": "enable"
        },
        body: JSON.stringify({
          model: 'wanx-v1',
          input: {
            prompt: payload.inputs
          },
          parameters: {
            style: '<auto>',
            size: '1024*1024',
            n: 1
          }
        })
      })

      if (!submitResponse.ok) {
        const errText = await submitResponse.text()
        throw new Error(`Wanx Submit Failed: ${errText}`)
      }

      const submitData = await submitResponse.json()
      const taskId = submitData.output.task_id

      // 2. Poll for Result (Simple loop in Edge Function)
      // Note: Edge Functions have execution time limits (usually 10s-60s). 
      // Wanx might take longer. If it timeouts, client should handle polling.
      // But for simplicity, we'll try polling here for a bit.
      
      let attempts = 0;
      const maxAttempts = 20; // 40s max
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
        
        const checkResponse = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
           headers: { 'Authorization': `Bearer ${QWEN_API_KEY}` }
        });

        if (!checkResponse.ok) continue;
        
        const checkData = await checkResponse.json();
        const status = checkData.output.task_status;

        if (status === 'SUCCEEDED') {
           if (checkData.output.results && checkData.output.results.length > 0) {
              const imageUrl = checkData.output.results[0].url;
              
              // Fetch the image and return blob to avoid CORS on the image URL itself if needed
              // But usually image URLs are accessible. Let's return the URL JSON for client to load.
              // Wait, previous implementation expected a blob. Let's fetch it.
              
              const imgRes = await fetch(imageUrl);
              const blob = await imgRes.blob();
              return new Response(blob, {
                headers: { ...corsHeaders, 'Content-Type': 'image/png' },
              })
           }
           break;
        } else if (status === 'FAILED' || status === 'CANCELED') {
           throw new Error(`Wanx Task Failed: ${JSON.stringify(checkData.output)}`);
        }
        
        attempts++;
      }
      
      throw new Error('Wanx Task Timeout in Edge Function');
    }

    return new Response(JSON.stringify({ error: 'Invalid type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
