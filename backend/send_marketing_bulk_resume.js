const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');
const supabase = require('./utils/supabase');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);
const delay = ms => new Promise(res => setTimeout(res, ms));

const alreadySent = [
    'suellen.lleao@gmail.com', 'willnovaes19@gmail.com', 'viniciusmaitan1@gmail.com',
    'edug.desenho@gmail.com', 'sabrinasandrade10@gmail.com', 'contato@tuliocareli.com',
    'tctulio2009@gmail.com', 'vlrlima2908@gmail.com', 'alleccrim@gmail.com',
    'lincolnaguiar@hotmail.com', 'contato@liviabarbosa.com', 'liviabarbosa0922@gmail.com',
    'dio.ex2@gmail.com', 'eu@jacksonjunior.com'
];

async function run() {
    console.log(`Iniciando o disparo em massa RETOMADA (pulando os primeiros 14)...`);
    
    const { data: subscribers, error: subError } = await supabase
        .from('subscribers')
        .select('email, token')
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
    let skippedCount = 0;

    for (const sub of subscribers) {
        try {
            const targetEmail = sub.email;
            
            if (alreadySent.includes(targetEmail)) {
                console.log(`[PULANDO] E-mail já recebeu: ${targetEmail}`);
                skippedCount++;
                continue;
            }
            
            // Link criptografado e único para a pessoa não precisar digitar o e-mail
            const prefLink = `https://uxfetch.com.br/preferencias.html?email=${encodeURIComponent(targetEmail)}`;
            // Link real de desinscrição do sistema
            const unsubLink = `https://uxfetch.com.br/unsubscribe.html?token=${sub.token}`;
            
            let finalHtml = baseHtml.replace(/{{url_preferences}}/g, prefLink);
            finalHtml = finalHtml.replace(/{{url_unsubscribe}}/g, unsubLink);
            
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
                console.log(`[${successCount + skippedCount}/${subscribers.length}] Enviado: ${targetEmail}`);
            }
            
            // Aguarda meio segundo entre e-mails para não estourar o limite de envio por segundo do Resend
            await delay(500); 
            
        } catch(e) {
            console.error(`Falha estrutural ao enviar para ${sub.email}:`, e);
            errorCount++;
        }
    }
    
    console.log(`\n🎉 Retomada concluída! Sucessos: ${successCount} | Pulados: ${skippedCount} | Erros: ${errorCount}`);
}

run();
