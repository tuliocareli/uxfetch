import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://uxfetch.com.br',
  'https://www.uxfetch.com.br',
  'http://localhost:3000',
  'http://127.0.0.1:5500', // Live Server local
]

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { email, preferred_roles, preferred_seniorities } = body

    if (!email) {
      throw new Error("Email é obrigatório")
    }

    // SEGURANÇA (FALHA 2): Valida o token de unsubscribe antes de permitir qualquer alteração.
    // O token é gerado internamente e enviado no link do e-mail — não pode ser adivinhado.
    // Sem ele, qualquer pessoa poderia alterar preferências de qualquer e-mail enviando um POST.
    const token = body.token
    if (!token) {
      throw new Error("Token de autorização ausente. Acesse esta página pelo link do e-mail.")
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Verifica se o par (email, token) é válido antes de atualizar qualquer dado.
    const { data: subscriber, error: findError } = await supabaseAdmin
      .from('subscribers')
      .select('id')
      .eq('email', email)
      .eq('token', token)
      .maybeSingle()

    if (findError) throw findError

    if (!subscriber) {
      // Retorna erro genérico para não vazar informação sobre quais e-mails existem
      throw new Error("Link inválido ou expirado. Acesse a página pelo link do seu e-mail.")
    }

    // Token e e-mail são válidos — prossegue com a atualização
    const { error: updateError } = await supabaseAdmin
      .from('subscribers')
      .update({ preferred_roles, preferred_seniorities })
      .eq('id', subscriber.id)

    if (updateError) {
      throw updateError
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // SEGURANÇA (FALHA 4): Nunca retornar mensagens de erro internas do Postgres ao client.
    const isUserFacingError = typeof error.message === 'string' && (
      error.message.includes("Token") ||
      error.message.includes("Email") ||
      error.message.includes("Link")
    )
    const clientMessage = isUserFacingError
      ? error.message
      : "Ocorreu um erro ao salvar suas preferências. Tente novamente."

    return new Response(JSON.stringify({ error: clientMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
