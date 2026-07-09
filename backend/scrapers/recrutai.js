const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeRecrutai() {
    console.log('[Recrut.ai] Iniciando scraping de vagas...');
    let allJobs = [];
    
    // Lista de empresas que utilizam a plataforma Recrut.ai
    const companies = [
        { name: 'Môre', baseUrl: 'https://vemsermore.jobs.recrut.ai' },
        { name: 'Fastshop', baseUrl: 'https://fastshop.jobs.recrut.ai' },
        { name: 'Grupo EBD', baseUrl: 'https://grupoebd.jobs.recrut.ai' }
    ];

    const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|motion\s+graphics|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|designer\b|videomaker|editor(a)?\s+de\s+v[ií]deo|audiovisual|edi[çc][ãa]o\s+de\s+v[ií]deo)/i;
    
    const excludeKeywords = [
        'desenvolvedor', 'developer', 'arquiteto', 'architect', 
        'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
        'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
        'moda', 'interiores', 'produto físico', 'embalagem',   'performance',
        'sobrancelha', 'sobrancelhas', 'unha', 'unhas', 'cílios', 'cilios', 'micropigmentação',
        'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'
    ];

    for (const companyObj of companies) {
        const endpoint = `${companyObj.baseUrl}/company/public-jobs/*/*/*/*/?search=`;
        
        try {
            const uniqueJobsMap = new Map();

            console.log(`[Recrut.ai - ${companyObj.name}] Buscando em: ${endpoint}`);
            const { data } = await axios.get(endpoint, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                }
            });

            const htmlData = data.html || data;
            const $ = cheerio.load(htmlData);

            $('.masonry-item').each((i, el) => {
                const badgeText = $(el).find('h5.color-primary span.badge').text() || '';
                const rawTitleStr = $(el).find('h5.color-primary').text() || '';
                
                let titleStr = rawTitleStr.replace(badgeText, '').trim(); 
                
                const parts = titleStr.split('|');
                let title = parts[0] ? parts[0].trim() : titleStr;
                
                // Fallback company if not specified in title
                let company = companyObj.name; 
                
                if (parts.length > 1) {
                    company = parts[1].split('(')[0].trim();
                }

                let locationAndRemote = '';
                $(el).find('.col-sm-12').each((j, col) => {
                   locationAndRemote += $(col).text() + ' ';
                });
                
                let href = $(el).find('a.btn').attr('href');
                if (!href) return;

                let link = href.startsWith('http') ? href : `${companyObj.baseUrl}/${href}`;

                if (title && link) {
                    uniqueJobsMap.set(link, { title, company, locationAndRemote, link });
                }
            });

            const extractedJobs = Array.from(uniqueJobsMap.values());
            console.log(`[Recrut.ai - ${companyObj.name}] Encontradas ${extractedJobs.length} vagas brutas. Aplicando filtros...`);

            for (let job of extractedJobs) {
                const t = job.title.toLowerCase();
                
                if (t.includes('vencida')) continue;

                const hasUxUi = includeRegex.test(t);
                const isExcluded = excludeKeywords.some(bad => t.includes(bad));
                
                if (isExcluded) continue;
                if (!hasUxUi) continue;

                let descriptionSnippet = `Oportunidade na ${job.company} via Recrut.ai.`;
                
                try {
                    const { data: jobHtml } = await axios.get(job.link, {
                        timeout: 10000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                        }
                    });
                    const $job = cheerio.load(jobHtml);
                    let fullText = $job('body').text().replace(/\s+/g, ' ').trim();
                    let descPart = fullText.split('Descrição da Vaga');
                    
                    if (descPart.length > 1) {
                        let extract = descPart.pop().trim();
                        if (extract.length > 50) {
                            descriptionSnippet = extract.substring(0, 250).trim();
                            if (descriptionSnippet.length > 10) descriptionSnippet += '...';
                        }
                    } else {
                        let extract = fullText.substring(0, 250).trim();
                        if (extract.length > 50) {
                            descriptionSnippet = extract + '...';
                        }
                    }
                } catch (e) {
                    console.error(`[Recrut.ai] Erro ao extrair descrição de ${job.link}: ${e.message}`);
                }

                const textLower = job.locationAndRemote.toLowerCase() + ' ' + t;
                const isRemote = textLower.includes('remot');
                
                let location = 'A Combinar';
                let workMode = 'in_person';
                
                if (isRemote) {
                    location = 'Remoto';
                    workMode = 'remote';
                } else if (textLower.includes('híbrid') || textLower.includes('hibrid')) {
                    location = 'Híbrido (Consulte Link)';
                    workMode = 'hybrid';
                } else {
                    location = 'Presencial (Consulte Link)';
                }

                allJobs.push({
                    title: job.title,
                    company: job.company,
                    location: location,
                    is_remote: isRemote,
                    work_mode: workMode,
                    url: job.link,
                    source: 'Recrut.ai',
                    description: descriptionSnippet
                });
            }

        } catch (error) {
            console.error(`[Recrut.ai - ${companyObj.name}] Erro ao buscar vagas:`, error.message);
        }
    }
    
    console.log(`[Recrut.ai] Finalizado! Total de vagas extraídas e validadas de todas as empresas: ${allJobs.length}`);
    return allJobs;
}

module.exports = scrapeRecrutai;
