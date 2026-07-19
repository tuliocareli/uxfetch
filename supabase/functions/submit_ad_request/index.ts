import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Inicializa o cliente do Supabase
    // Como queremos inserir na tabela ad_requests, que não deve ser publicamente inserível sem RLS,
    // usaremos a role atual (se houver JWT) ou service_role se precisarmos bypassar RLS.
    // Para simplificar e garantir que a inserção funcione via server, usaremos a SERVICE_ROLE_KEY.
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const payload = await req.json();

    // 1. Insert into ad_requests
    const { data: dbData, error: dbError } = await supabase
      .from("ad_requests")
      .insert([payload])
      .select()
      .single();

    if (dbError) {
      console.error("DB Insert Error:", dbError);
      throw new Error("Falha ao salvar a requisição no banco de dados.");
    }

    // 2. Send Email via Resend
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    
    if (RESEND_API_KEY) {
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0055ff;">Nova Solicitação de Patrocínio - UX Fetch</h2>
          <p>Um novo interessado preencheu o formulário em <strong>uxfetch.com.br/anuncie.html</strong>.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <ul style="list-style: none; padding: 0;">
            <li style="margin-bottom: 10px;"><strong>Tipo de Anúncio:</strong> ${payload.tipo.toUpperCase()}</li>
            <li style="margin-bottom: 10px;"><strong>Nome do Contato:</strong> ${payload.nome}</li>
            <li style="margin-bottom: 10px;"><strong>E-mail Corporativo:</strong> <a href="mailto:${payload.email}">${payload.email}</a></li>
            <li style="margin-bottom: 10px;"><strong>Empresa / Produto:</strong> ${payload.empresa}</li>
            <li style="margin-bottom: 10px;"><strong>Site do Produto:</strong> <a href="${payload.site_url}">${payload.site_url}</a></li>
            <li style="margin-bottom: 10px;"><strong>Formato Desejado:</strong> ${payload.formato}</li>
            <li style="margin-bottom: 10px;"><strong>Orçamento/Período:</strong> ${payload.orcamento || 'Não informado'}</li>
            ${payload.tipo === 'newsletter' ? `
            <li style="margin-bottom: 10px;"><strong>Link de Destino:</strong> ${payload.link_destino || 'Não informado'}</li>
            <li style="margin-bottom: 10px;"><strong>Texto do Anúncio:</strong> ${payload.texto_anuncio || 'Não informado'}</li>
            ` : ''}
            <li style="margin-bottom: 10px;"><strong>Descrição:</strong> ${payload.descricao || 'Não informado'}</li>
          </ul>
        </div>
      `;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "UX Fetch Ads <contato@uxfetch.com.br>", 
          to: ["contato@uxfetch.com.br"],
          reply_to: payload.email, // Permite que você apenas clique em "Responder" no seu email
          subject: `🎯 Novo Patrocínio: ${payload.empresa} (${payload.tipo.toUpperCase()})`,
          html: emailHtml,
        }),
      });

      if (!resendRes.ok) {
        const errorText = await resendRes.text();
        console.error("Resend Error:", errorText);
        // Não lançamos erro aqui para que o usuário do site veja a mensagem de sucesso
        // mesmo se o e-mail falhar, já que está salvo no banco.
      }
    } else {
      console.warn("RESEND_API_KEY não foi encontrada nas variáveis de ambiente. O e-mail não foi enviado, mas os dados foram salvos no banco.");
    }

    return new Response(JSON.stringify({ success: true, data: dbData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
