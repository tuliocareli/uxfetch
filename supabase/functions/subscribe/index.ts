import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { email, city, accept_other_cities, accept_remote, only_remote, accepts_hybrid, turnstileToken } = body

    if (!turnstileToken) {
      throw new Error("Token do Turnstile ausente")
    }

    // Valida o Token na Cloudflare
    const secretKey = Deno.env.get('TURNSTILE_SECRET_KEY')
    if (!secretKey) throw new Error("Chave secreta do Turnstile não configurada")

    const formData = new FormData()
    formData.append('secret', secretKey)
    formData.append('response', turnstileToken)

    const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    })

    const cfData = await cfRes.json()

    if (!cfData.success) {
      console.error("Turnstile error:", cfData)
      throw new Error("Falha na validação de segurança (CAPTCHA inválido)")
    }

    // Se o humano é real, insere no banco com privilégio de administrador (Service Role)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data, error } = await supabaseAdmin
      .from('subscribers')
      .insert([
        { 
          email, 
          city, 
          accept_other_cities, 
          accept_remote, 
          only_remote, 
          accepts_hybrid 
        }
      ])

    if (error) {
      if (error.code === '23505') {
        // Ignora erro de e-mail duplicado, pois o Frontend espera sucesso visualmente
        console.log('Usuário já inscrito:', email);
      } else {
        throw error
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
