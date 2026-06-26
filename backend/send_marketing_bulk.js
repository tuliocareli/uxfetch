const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');
const supabase = require('./utils/supabase');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);
const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
    console.log(`Iniciando o disparo em massa da campanha de Atualização de Radar...`);
    
    const { data: subscribers, error: subError } = await supabase
        .from('subscribers')
        .select('email')
        .eq('is_active', true);
        
    if (subError || !subscribers) {
        console.error('Erro ao buscar inscritos:', subError);
        process.exit(1);
    }
    
    console.log(`Encontrados ${subscribers.length} inscritos ativos para o disparo.`);

    const htmlPath = path.join(__dirname, '../mockup_email_marketing.html');
    let baseHtml = fs.readFileSync(htmlPath, 'utf8');
    
    // Caminho absoluto para o GIF publicado
    baseHtml = baseHtml.replace(/src="email-filtros-uxfetch\.gif"/g, 'src="https://uxfetch.com.br/email-filtros-uxfetch.gif"');

    let successCount = 0;
    let errorCount = 0;

    for (const sub of subscribers) {
        try {
            const targetEmail = sub.email;
            // Link criptografado e único para a pessoa não precisar digitar o e-mail
            const realLink = `https://uxfetch.com.br/preferencias.html?email=${encodeURIComponent(targetEmail)}`;
            
            const finalHtml = baseHtml.replace(/href="#"/g, `href="${realLink}"`);
            
            const { error } = await resend.emails.send({
                from: 'UX Fetch <contato@uxfetch.com.br>',
                to: [targetEmail],
                subject: 'Uma atualização importante no seu radar de vagas',
                html: finalHtml
            });

            if (error) {
                console.error(`Erro no envio para ${targetEmail}:`, error.message);
                errorCount++;
            } else {
                successCount++;
                console.log(`[${successCount}/${subscribers.length}] Enviado: ${targetEmail}`);
            }
            
            // Aguarda meio segundo entre e-mails para não estourar o limite de envio por segundo do Resend
            await delay(500); 
            
        } catch(e) {
            console.error(`Falha estrutural ao enviar para ${sub.email}:`, e);
            errorCount++;
        }
    }
    
    console.log(`\n🎉 Disparo concluído! Sucessos: ${successCount} | Erros: ${errorCount}`);
}

run();
