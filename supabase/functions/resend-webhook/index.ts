import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    // Apenas permite POST
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Pega o corpo da requisição (Payload do Resend)
    const payload = await req.json();
    
    // O Resend manda eventos no formato: 
    // { "type": "email.opened", "data": { "to": ["email@example.com"], "email_id": "123" ... } }
    
    if (payload && payload.type && payload.data && payload.data.to) {
        const emails = payload.data.to;
        
        if (Array.isArray(emails) && emails.length > 0) {
            const userEmail = emails[0]; // Usualmente enviado para 1 pessoa
            const eventType = payload.type; // ex: email.delivered, email.opened
            const emailId = payload.data.email_id || null;
            
            console.log(`[Webhook] Evento: ${eventType} | E-mail: ${userEmail}`);
            
            // 1. Gravar a métrica no histórico analítico (Novo)
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
            
            // 2. Atualizar a Sunset Policy (Manter Lógica Antiga)
            // Se o usuário interagiu, zeramos o cronômetro dele para mantê-lo ativo.
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
        // Se for um payload inválido
        console.log('Payload ignorado. Estrutura inválida ou tipo:', payload?.type);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
