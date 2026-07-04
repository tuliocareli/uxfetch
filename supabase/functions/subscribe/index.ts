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

    // Busca o token do usuário recém inserido (ou já existente) para retornar ao frontend
    // O token é necessário para o Step 2 (preferências) validar a identidade do caller
    const { data: subData } = await supabaseAdmin
      .from('subscribers')
      .select('token')
      .eq('email', email)
      .maybeSingle()

    return new Response(JSON.stringify({ success: true, token: subData?.token || null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // SEGURANÇA (FALHA 4): Nunca expor mensagens internas do Postgres ao cliente.
    // Erros do Postgres contêm detalhes de schema que não devem ser públicos.
    // Apenas erros de negócio conhecidos (Turnstile, token ausente) chegam ao client com a mensagem original.
    const isKnownBusinessError = typeof error.message === 'string' && (
      error.message.includes('Turnstile') ||
      error.message.includes('ausente') ||
      error.message.includes('inválid') ||
      error.message.includes('configurad')
    )
    const clientMessage = isKnownBusinessError
      ? error.message
      : 'Ocorreu um erro ao processar sua inscrição. Tente novamente.'

    return new Response(JSON.stringify({ error: clientMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
