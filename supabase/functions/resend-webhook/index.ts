import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * SEGURANÇA (FALHA 3): Verifica a assinatura HMAC do webhook do Resend.
 * O Resend assina cada requisição com svix-id, svix-timestamp e svix-signature.
 * Sem essa verificação, qualquer um com a URL pública da função poderia forjar eventos.
 *
 * Documentação: https://resend.com/docs/dashboard/webhooks/introduction#verifying-the-webhook
 */
async function verifyResendSignature(req: Request, rawBody: string): Promise<boolean> {
  const webhookSecret = Deno.env.get('RESEND_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('[Webhook] RESEND_WEBHOOK_SECRET não configurado. Requisição rejeitada por segurança.')
    return false
  }

  const svixId        = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    console.error('[Webhook] Headers de assinatura ausentes.')
    return false
  }

  // Monta o payload assinado conforme especificação do Svix
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`

  // Decodifica a chave secreta do formato whsec_base64 do Resend
  const secretBytes = Uint8Array.from(
    atob(webhookSecret.replace(/^whsec_/, '')),
    (c) => c.charCodeAt(0)
  )

  const key = await crypto.subtle.importKey(
    'raw',
    secretBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signedContent)
  )

  const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))

  // svix-signature pode conter múltiplas assinaturas separadas por espaço (ex: "v1,base64== v1,base64==")
  const signatures = svixSignature.split(' ')
  const isValid = signatures.some((sig) => {
    const [, sigValue] = sig.split(',')
    return sigValue === computedSignature
  })

  if (!isValid) {
    console.error('[Webhook] Assinatura inválida. Payload possivelmente forjado.')
  }

  return isValid
}

serve(async (req) => {
  try {
    // Apenas permite POST
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Lê o body como texto antes de parsear para poder verificar a assinatura
    const rawBody = await req.text()

    // SEGURANÇA: rejeita requisições sem assinatura HMAC válida do Resend
    const isValid = await verifyResendSignature(req, rawBody)
    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Assinatura inválida' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const payload = JSON.parse(rawBody)

    // O Resend manda eventos no formato:
    // { "type": "email.opened", "data": { "to": ["email@example.com"], "email_id": "123" ... } }

    if (payload && payload.type && payload.data && payload.data.to) {
        const emails = payload.data.to;

        if (Array.isArray(emails) && emails.length > 0) {
            const userEmail = emails[0]; // Usualmente enviado para 1 pessoa
            const eventType = payload.type; // ex: email.delivered, email.opened
            const emailId = payload.data.email_id || null;

            console.log(`[Webhook] Evento: ${eventType} | E-mail: ${userEmail}`);

            // 1. Gravar a métrica no histórico analítico
            const { error: insertError } = await supabase
              .from('email_events')
              .insert([{
                  email: userEmail,
                  event_type: eventType,
                  email_id: emailId
              }]);

            if (insertError) {
              console.error('Erro ao salvar métrica de evento na tabela email_events:', insertError);
            }

            // 2. Atualizar a Sunset Policy
            if (eventType === 'email.opened' || eventType === 'email.clicked') {
                const { error: updateError } = await supabase
                  .from('subscribers')
                  .update({ last_opened_at: new Date().toISOString() })
                  .eq('email', userEmail);

                if (updateError) {
                  console.error('Erro ao atualizar banco (Sunset Policy):', updateError);
                } else {
                  console.log(`last_opened_at atualizado para: ${userEmail}`);
                }
            }
        }
    } else {
        console.log('Payload ignorado. Estrutura inválida ou tipo:', payload?.type);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Erro interno ao processar o webhook.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
