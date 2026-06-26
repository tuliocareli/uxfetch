const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');
const supabase = require('./utils/supabase');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);
const targetEmail = 'tctulio2009@gmail.com';

async function run() {
    console.log(`Preparando Teste V2 para ${targetEmail}...`);
    
    // Busca os dados exatamente como o script de produção fará
    const { data: sub, error: subError } = await supabase
        .from('subscribers')
        .select('email, token')
        .eq('email', targetEmail)
        .single();
        
    if (subError || !sub) {
        console.error('Erro ao buscar usuário do banco:', subError);
        process.exit(1);
    }

    const htmlPath = path.join(__dirname, '../mockup_email_marketing.html');
    let baseHtml = fs.readFileSync(htmlPath, 'utf8');
    
    // Arruma o caminho do GIF para apontar para a web
    baseHtml = baseHtml.replace(/src="email-filtros-uxfetch\.gif"/g, 'src="https://uxfetch.com.br/email-filtros-uxfetch.gif"');

    // Monta os links
    const prefLink = `https://uxfetch.com.br/preferencias.html?email=${encodeURIComponent(sub.email)}`;
    const unsubLink = `https://uxfetch.com.br/unsubscribe.html?token=${sub.token}`;
    
    console.log("👉 Link de Preferências gerado:", prefLink);
    console.log("👉 Link de Cancelamento gerado:", unsubLink);

    let finalHtml = baseHtml.replace(/{{url_preferences}}/g, prefLink);
    finalHtml = finalHtml.replace(/{{url_unsubscribe}}/g, unsubLink);

    try {
        const { data, error } = await resend.emails.send({
            from: 'UX Fetch <contato@uxfetch.com.br>',
            to: [targetEmail],
            subject: '[TESTE FINAL] Uma atualização importante no seu radar de vagas',
            html: finalHtml
        });

        if (error) {
            console.error('Erro ao enviar:', error);
        } else {
            console.log('✅ E-mail enviado com sucesso! ID:', data.id);
        }
    } catch (e) {
        console.error('Falha na API:', e);
    }
}

run();
