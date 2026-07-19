const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_CONTATO = "contato@uxfetch.com.br"; // TODO: Substituir por vagas@meudominio.com

function getDominantRole(jobs) {
    const roleMap = {};
    for (const job of jobs) {
        const title = (job.title || '').toLowerCase();
        if (title.includes('product designer'))        roleMap['Product Designer']  = (roleMap['Product Designer']  || 0) + 1;
        else if (title.includes('ux designer'))        roleMap['UX Designer']       = (roleMap['UX Designer']       || 0) + 1;
        else if (title.includes('ux researcher') || title.includes('pesquisador'))
                                                       roleMap['UX Researcher']     = (roleMap['UX Researcher']     || 0) + 1;
        else if (title.includes('ui designer'))        roleMap['UI Designer']       = (roleMap['UI Designer']       || 0) + 1;
        else if (title.includes('service designer'))   roleMap['Service Designer']  = (roleMap['Service Designer']  || 0) + 1;
        else                                           roleMap['Design']            = (roleMap['Design']            || 0) + 1;
    }
    const sorted = Object.entries(roleMap).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : 'Design';
}

async function sendDailyEmail(user, jobs, recentJobs = [], isDigestMode = false) {
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

        // Bloco final da seção de vagas novas: Texto condicional + Botão Fixo
        let callToActionHtml = `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px; margin-bottom:24px; text-align:center;">
            <tr>
                <td>`;
                
        if (jobs.length > limit) {
            const excessCount = jobs.length - limit;
            callToActionHtml += `<p style="font-size:16px; color:#4A5568; margin-bottom:16px;">O radar encontrou mais <strong>${excessCount} vagas</strong> inéditas hoje!</p>`;
        } else {
            callToActionHtml += `<p style="font-size:16px; color:#4A5568; margin-bottom:16px;">Quer explorar o histórico completo ou usar os filtros avançados?</p>`;
        }

        callToActionHtml += `
                    <a href="https://uxfetch.com.br/vagas" class="btn" style="
            display: inline-block;
            background-color: #0055ff;
            color: #ffffff;
            text-decoration: none;
            padding: 16px 32px; border-radius:8px; font-weight: bold;">Acessar o Mural Web &rarr;</a>
                </td>
            </tr>
        </table>
        `;
        
        jobsHtml += callToActionHtml;

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
        const rawName = name.charAt(0).toUpperCase() + name.slice(1);
        // SEGURANÇA (FALHA 7): Escapa o nome antes de injetar no HTML do e-mail.
        // O prefixo de um e-mail pode conter caracteres como < > & que fariam XSS em clientes HTML.
        const formattedName = rawName
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        let introTitle = 'Novas oportunidades no radar!';
        let introText = `Fala <strong>${formattedName}</strong>, o motor do UX Fetch terminou a varredura de hoje. Filtramos os portais de RH e separamos as oportunidades de Produto e Design que dão match com você. Confere o que está em alta:`;

        // Subject dinâmico baseado nas vagas reais do dia
        const dominantRole = getDominantRole(jobs);
        const jobCount = jobs.length;
        let subject;
        if (jobCount === 1) {
            subject = `Encontrei 1 vaga de ${dominantRole} que pode ser a sua hoje`;
        } else if (jobCount <= 5) {
            subject = `Encontrei ${jobCount} vagas de ${dominantRole} abertas hoje`;
        } else {
            subject = `${jobCount} vagas de Design no radar hoje — confira antes que fechem`;
        }

        if (isDigestMode) {
            introTitle = 'Boletim Diário UX Fetch 📌';
            introText = `Fala <strong>${formattedName}</strong>! Hoje o mercado deu uma respirada e não detectamos vagas inéditas para o seu perfil. Para manter o radar ativo, separamos as melhores oportunidades recentes que continuam em aberto:`;
            
            if (jobCount === 1) {
                subject = `Nada novo hoje, mas essa 1 vaga ainda está aberta`;
            } else {
                subject = `Nada novo hoje, mas essas ${jobCount} vagas ainda estão abertas`;
            }
        }

        if (user.isWeeklyDigest) {
            introTitle = 'Boletim Semanal UX Fetch 📌';
            subject = 'Reduzimos a frequência dos seus e-mails. Veja o radar da semana:';
            introText = `
            <div style="font-size:14px; color:#718096; text-align:center; margin-bottom: 24px; padding: 16px; background-color: #F7FAFC; border-radius: 8px;">
              💡 Reduzimos a frequência de e-mails para você com base no seu padrão de uso.<br>
              Quer voltar a receber o radar todo dia? <strong>Só abrir este e-mail já reativa sua assinatura diária.</strong>
            </div>
            ${introText}
            `;
        }

        const currentMs = Date.now();
        const cutoffDate = new Date('2026-07-23T00:00:00Z').getTime(); // Desliga a campanha no dia 23 de Julho
        let avisoTermosHtml = '';

        if (currentMs < cutoffDate) {
            const dayOfYear = Math.floor(currentMs / 1000 / 60 / 60 / 24);
            const variationIndex = dayOfYear % 3;
            
            const psCopies = [
                // Envio 1
                '<strong>P.S.:</strong> O UXfetch está crescendo! Para manter a nossa curadoria 100% gratuita para você, atualizamos nossos Termos de Uso (julho/2026). Passaremos a usar estatísticas gerais e anônimas da plataforma (como "volume total de cliques" ou "taxa de abertura de e-mails") para buscar patrocinadores que apoiem o projeto. Fique tranquilo: seu e-mail, seu comportamento individual e seus dados continuam blindados e não são compartilhados com terceiros. <a href="https://uxfetch.com.br/termos.html" target="_blank" style="color:#1D4ED8; font-weight:600; text-decoration:underline;">Leia os Termos atualizados aqui &rarr;</a>',
                
                // Envio 2
                '<strong>P.S.:</strong> Se você perdeu o aviso de ontem &mdash; atualizamos os Termos de Uso pra deixar claro como usamos estatísticas anônimas (nunca seu e-mail ou dado individual) na busca por patrocinadores que mantêm o UXfetch gratuito. <a href="https://uxfetch.com.br/termos.html" target="_blank" style="color:#1D4ED8; font-weight:600; text-decoration:underline;">Termos aqui &rarr;</a>',
                
                // Envio 3
                '<strong>P.S.:</strong> Última vez que menciono isso por aqui &mdash; Termos de Uso atualizados em julho/2026, com detalhes de como usamos dados anônimos da plataforma. <a href="https://uxfetch.com.br/termos.html" target="_blank" style="color:#1D4ED8; font-weight:600; text-decoration:underline;">Confira aqui &rarr;</a>'
            ];

            const selectedCopy = psCopies[variationIndex];

            avisoTermosHtml = `
      <tr>
        <td style="padding:10px 30px 20px 30px;">
          <div style="background-color:#EFF6FF; border:1px solid #BFDBFE; border-radius:12px; padding:20px;">
            <p style="margin:0; font-size:14px; line-height:22px; color:#1E3A8A;">
              ${selectedCopy}
            </p>
          </div>
        </td>
      </tr>`;
        }

        templateHtml = templateHtml.replace(/{{AVISO_TERMOS_PLACEHOLDER}}/g, avisoTermosHtml);
        templateHtml = templateHtml.replace(/{{intro_title}}/g, introTitle);
        templateHtml = templateHtml.replace(/{{intro_text}}/g, introText);
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
        
        // Link de Preferências de Vaga (Área e Senioridade)
        // SEGURANÇA: inclui o token do usuário para que a Edge Function possa validar a identidade do caller.
        templateHtml = templateHtml.replace(/{{url_preferences}}/g, `https://uxfetch.com.br/preferencias.html?email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(user.token || '')}`);
        
        // Link da página oficial de desinscrição com destruição de dados (LGPD) - Agora via Token Seguro
        templateHtml = templateHtml.replace(/{{url_unsubscribe}}/g, `https://uxfetch.com.br/unsubscribe.html?token=${user.token}`);

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
