const fs = require('fs');
const path = require('path');
const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);
const targetEmail = 'tctulio2009@gmail.com';

async function run() {
    console.log(`Preparando envio do E-mail Marketing Teste para ${targetEmail}...`);
    
    const htmlPath = path.join(__dirname, '../mockup_email_marketing.html');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Substitui links fictícios pelo link real do usuário
    const realLink = `https://uxfetch.com.br/preferencias.html?email=${encodeURIComponent(targetEmail)}`;
    htmlContent = htmlContent.replace(/href="#"/g, `href="${realLink}"`);
    
    // Arruma o caminho do GIF para apontar para a web (já que e-mails precisam de links absolutos)
    htmlContent = htmlContent.replace(/src="email-filtros-uxfetch\.gif"/g, 'src="https://uxfetch.com.br/email-filtros-uxfetch.gif"');

    try {
        const { data, error } = await resend.emails.send({
            from: 'UX Fetch <contato@uxfetch.com.br>',
            to: [targetEmail],
            subject: 'Novidade: O UX Fetch agora filtra as vagas para o SEU momento de carreira 🎯',
            html: htmlContent
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
