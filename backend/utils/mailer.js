const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_CONTATO = "contato@uxfetch.com.br"; // TODO: Substituir por vagas@meudominio.com

async function sendDailyEmail(user, jobs) {
    if (!jobs || jobs.length === 0) {
        console.log(`Nenhuma vaga para o usuário ${user.email}. Pulando e-mail.`);
        return;
    }

    try {
        const templatePath = path.join(__dirname, '../emails/template.html');
        const jobTemplatePath = path.join(__dirname, '../emails/jobTemplate.html');
        
        let templateHtml = fs.readFileSync(templatePath, 'utf8');
        const jobTemplateHtml = fs.readFileSync(jobTemplatePath, 'utf8');

        let jobsHtml = '';

        for (const job of jobs) {
            let jobBlock = jobTemplateHtml;
            jobBlock = jobBlock.replace(/{{modelo_trabalho}}/g, job.is_remote ? 'Home Office' : 'Híbrido/Presencial');
            jobBlock = jobBlock.replace(/{{regime}}/g, 'A Consultar'); // Placeholder, já que o scraper ainda não pega regime
            jobBlock = jobBlock.replace(/{{titulo_cargo}}/g, job.title);
            jobBlock = jobBlock.replace(/{{empresa}}/g, job.company);
            jobBlock = jobBlock.replace(/{{cidade}}/g, job.location);
            
            let desc = job.description || `Oportunidade incrível na ${job.company} encontrada hoje pelo radar UX Fetch.`;
            jobBlock = jobBlock.replace(/{{breve_descricao}}/g, desc);
            
            jobBlock = jobBlock.replace(/{{url_vaga}}/g, job.url);
            
            jobsHtml += jobBlock;
        }

        // Nome extraído do e-mail (antes do @)
        const name = user.email.split('@')[0];
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

        templateHtml = templateHtml.replace(/{{nome}}/g, formattedName);
        templateHtml = templateHtml.replace(/{{VAGAS_PLACEHOLDER}}/g, jobsHtml);
        templateHtml = templateHtml.replace(/{{email_contato}}/g, EMAIL_CONTATO);
        
        // Data para evitar agrupamento abusivo do Gmail
        const dataEnvio = new Date().toLocaleString('pt-BR');
        templateHtml = templateHtml.replace(/{{data_envio}}/g, dataEnvio);
        // Link da página oficial de desinscrição com destruição de dados (LGPD)
        templateHtml = templateHtml.replace(/{{url_unsubscribe}}/g, `https://uxfetch.com.br/unsubscribe.html?email=${user.email}`);

        const subject = `O radar do UX Fetch atualizou: Novas vagas para você, ${formattedName} 🎯`;

        const { data, error } = await resend.emails.send({
            from: 'UX Fetch <contato@uxfetch.com.br>',
            to: [user.email],
            subject: subject,
            html: templateHtml
        });

        if (error) {
            console.error(`Erro ao enviar e-mail para ${user.email}:`, error);
        } else {
            console.log(`E-mail enviado com sucesso para ${user.email} (ID: ${data.id})`);
        }

    } catch (err) {
        console.error('Falha crítica no Mailer:', err);
    }
}

module.exports = { sendDailyEmail };
