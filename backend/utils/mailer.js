const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_CONTATO = "contato@uxfetch.com.br"; // TODO: Substituir por vagas@meudominio.com

async function sendDailyEmail(user, jobs, recentJobs = []) {
    if (!jobs || jobs.length === 0) {
        console.log(`Nenhuma vaga para o usuário ${user.email}. Pulando e-mail.`);
        return;
    }

    try {
        const templatePath = path.join(__dirname, '../emails/template.html');
        const jobTemplatePath = path.join(__dirname, '../emails/jobTemplate.html');
        const recentJobTemplatePath = path.join(__dirname, '../emails/recentJobTemplate.html');
        
        let templateHtml = fs.readFileSync(templatePath, 'utf8');
        const jobTemplateHtml = fs.readFileSync(jobTemplatePath, 'utf8');
        let recentJobTemplateHtml = '';
        if (fs.existsSync(recentJobTemplatePath)) {
            recentJobTemplateHtml = fs.readFileSync(recentJobTemplatePath, 'utf8');
        }

        let jobsHtml = '';
        const limit = 15;
        const slicedJobs = jobs.slice(0, limit);
        
        for (const job of slicedJobs) {
            let jobBlock = jobTemplateHtml;
            
            let badgeText = 'PRESENCIAL';
            let bgColor = '#E4E4E7'; // Cinza
            let textColor = '#3F3F46'; // Cinza Escuro
            
            if (job.work_mode === 'remote' || (job.is_remote && !job.work_mode)) {
                badgeText = 'HOME OFFICE';
                bgColor = '#E0E7FF'; // Azul Claro
                textColor = '#0055FF'; // Azul
            } else if (job.work_mode === 'hybrid') {
                badgeText = 'HÍBRIDO';
                bgColor = '#F3E8FF'; // Roxo Claro
                textColor = '#7C3AED'; // Roxo
            }

            jobBlock = jobBlock.replace(/{{modelo_trabalho}}/g, badgeText);
            jobBlock = jobBlock.replace(/{{cor_fundo_modelo}}/g, bgColor);
            jobBlock = jobBlock.replace(/{{cor_texto_modelo}}/g, textColor);
            jobBlock = jobBlock.replace(/{{regime}}/g, 'A Consultar'); // Placeholder, já que o scraper ainda não pega regime
            
            const tagIntl = job.is_international ? `<span style="display:inline-block; padding:4px 8px; background-color:#FEF3C7; color:#B45309; border-radius:4px; font-size:12px; font-weight:600; margin-bottom:12px; margin-left:8px; text-transform:uppercase;">🌍 INTERNACIONAL</span>` : '';
            jobBlock = jobBlock.replace(/{{tag_internacional}}/g, tagIntl);
            
            jobBlock = jobBlock.replace(/{{titulo_cargo}}/g, job.title);
            jobBlock = jobBlock.replace(/{{empresa}}/g, job.company);
            jobBlock = jobBlock.replace(/{{cidade}}/g, job.location);
            
            let desc = job.description || `Oportunidade incrível na ${job.company} encontrada hoje pelo radar UX Fetch.`;
            jobBlock = jobBlock.replace(/{{breve_descricao}}/g, desc);
            
            // Usamos o redirecionador interno para evitar filtros de spam (ex: links da Gupy direto no e-mail)
            const safeUrl = `https://uxfetch.com.br/vaga?id=${job.id}`;
            jobBlock = jobBlock.replace(/{{url_vaga}}/g, safeUrl);
            
            jobsHtml += jobBlock;
        }

        if (jobs.length > limit) {
            const excessCount = jobs.length - limit;
            jobsHtml += `
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px; margin-bottom:24px; text-align:center;">
                <tr>
                    <td>
                        <p style="font-size:16px; color:#4A5568; margin-bottom:16px;">O radar encontrou mais <strong>${excessCount} vagas</strong> inéditas hoje!</p>
                        <a href="https://uxfetch.com.br/vagas" class="btn" style="
                display: inline-block;
                background-color: #0055ff;
                color: #ffffff;
                text-decoration: none;
                padding: 16px 32px; border-radius:8px;">Ver todas no Mural Web &rarr;</a>
                    </td>
                </tr>
            </table>
            `;
        }

        let recentJobsHtml = '';
        if (recentJobs.length > 0 && recentJobTemplateHtml) {
            for (const job of recentJobs) {
                let jobBlock = recentJobTemplateHtml;
                
                let badgeText = 'PRESENCIAL';
                let bgColor = '#E4E4E7';
                let textColor = '#3F3F46';
                
                if (job.work_mode === 'remote' || (job.is_remote && !job.work_mode)) {
                    badgeText = 'HOME OFFICE';
                    bgColor = '#E0E7FF';
                    textColor = '#0055FF';
                } else if (job.work_mode === 'hybrid') {
                    badgeText = 'HÍBRIDO';
                    bgColor = '#F3E8FF';
                    textColor = '#7C3AED';
                }

                jobBlock = jobBlock.replace(/{{modelo_trabalho}}/g, badgeText);
                jobBlock = jobBlock.replace(/{{cor_fundo_modelo}}/g, bgColor);
                jobBlock = jobBlock.replace(/{{cor_texto_modelo}}/g, textColor);
                jobBlock = jobBlock.replace(/{{regime}}/g, 'A Consultar');

                jobBlock = jobBlock.replace(/{{titulo_cargo}}/g, job.title);
                jobBlock = jobBlock.replace(/{{empresa}}/g, job.company);
                
                let locationStr = job.location;
                if (job.is_remote && locationStr !== 'Remoto') {
                    locationStr += ' (Remoto)';
                }
                jobBlock = jobBlock.replace(/{{cidade}}/g, locationStr);
                
                const safeUrl = `https://uxfetch.com.br/vaga?id=${job.id}`;
                jobBlock = jobBlock.replace(/{{url_vaga}}/g, safeUrl);
                
                recentJobsHtml += jobBlock;
            }
        } else {
            // Se não houver vagas recentes, esconde a seção inteira usando regex no template original,
            // ou apenas remove o placeholder. Como o título da seção ficou hardcoded no template.html,
            // precisaremos de uma lógica para não enviar o cabeçalho se recentJobsHtml for vazio.
            // O template atual tem a seção e o placeholder juntos. 
            // Para simplificar, vou remover a seção hardcoded do template.html caso não tenha recentes, 
            // ou melhor, injetar o título junto com as vagas no placeholder.
            // Para consertar o que fiz: Se não tem recentJobsHtml, apagamos o HTML ao redor do placeholder no template.
        }

        // Nome extraído do e-mail (antes do @)
        const name = user.email.split('@')[0];
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);

        templateHtml = templateHtml.replace(/{{nome}}/g, formattedName);
        templateHtml = templateHtml.replace(/{{VAGAS_PLACEHOLDER}}/g, jobsHtml);
        
        if (recentJobsHtml) {
            templateHtml = templateHtml.replace(/{{VAGAS_RECENTES_PLACEHOLDER}}/g, recentJobsHtml);
        } else {
            // Remove a seção "Ainda em aberto" inteira do HTML se não houver vagas recentes
            templateHtml = templateHtml.replace(/<!-- SEÇÃO: AINDA EM ABERTO -->[\s\S]*?{{VAGAS_RECENTES_PLACEHOLDER}}[\s\S]*?<\/td>\s*<\/tr>/, '');
        }

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
