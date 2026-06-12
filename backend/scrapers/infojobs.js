const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeInfojobs() {
    console.log('[Infojobs] Iniciando scraping na rota principal de UX/Design...');
    const jobs = [];
    const url = 'https://www.infojobs.com.br/vagas-de-emprego-ux-designer.aspx';

    const includeRegex = /\b(ux|ui|product design|product designer|design engineer|research|researcher|design ops|staff designer|designer digital)\b/i;
    const excludeKeywords = [
        'desenvolvedor', 'developer', 'arquiteto', 'architect', 
        'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
        'backend', 'fullstack', 'full stack', 'data', 'qa', 'tester',
        'gráfico', 'graphic', 'motion', 'video', 'vídeo', 'audiovisual', '3d', 'moda', 'interiores', 'produto físico', 'embalagem', 'marketing', 'social media', 'performance',
        'sobrancelha', 'sobrancelhas', 'unha', 'unhas', 'cílios', 'cilios', 'micropigmentação'
    ];

    try {
        const { data } = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        const uniqueJobsMap = new Map();

        $('[data-id]').each((i, el) => {
            const $el = $(el);
            const $titleLink = $el.find('a').first();
            let link = $titleLink.attr('href') || '';
            if (link && !link.startsWith('http')) {
                link = 'https://www.infojobs.com.br' + link;
            }

            let title = $el.find('.js_vacancyTitle').text().replace(/\s+/g, ' ').trim();
            
            $el.find('.cursor-pointer').remove(); // Remove tooltip
            let companyRaw = $el.find('.d-flex.align-items-baseline .text-body').text();
            
            let company = companyRaw.replace(/\s+/g, ' ').trim();
            // Remove exactly duplicated strings (e.g. "COMPANY COMPANY")
            company = company.replace(/^(.+?)\s+\1$/, '$1').trim();

            if (!company || company.toLowerCase().includes('confidencial')) {
                company = 'Confidencial';
            }

            // Location is usually in the first .mb-8 after the company
            let locationRaw = $el.find('.mb-8').first().text().replace(/\s+/g, ' ').trim();
            locationRaw = locationRaw.split(',')[0]; // remove the "X Km de você"

            let descriptionSnippet = $el.find('.text-medium').last().text().replace(/\s+/g, ' ').trim() || `Vaga de ${title} na empresa ${company}.`;

            if (title && link) {
                const t = title.toLowerCase();
                const hasUxUi = includeRegex.test(t);
                const isExcluded = excludeKeywords.some(bad => t.includes(bad));

                if (isExcluded) {
                    console.log(`[DEBUG] Rejeitada (Palavra proibida): ${title}`);
                    return;
                }
                if (!hasUxUi && !t.includes('designer')) {
                    console.log(`[DEBUG] Rejeitada (Sem keyword UX/UI): ${title}`);
                    return;
                }

                // FILTER CONFIDENTIAL JOBS AS REQUESTED
                if (company === 'Confidencial' || company.toLowerCase().includes('consultoria') || company.toLowerCase().includes('rh')) {
                    console.log(`[DEBUG] Rejeitada (Confidencial/RH): ${title} - Empresa: ${company}`);
                    return; 
                }

                let isRemote = false;
                let location = locationRaw || 'A Combinar';
                
                // Infojobs sometimes shows "Presencial", "Híbrido", or "Remoto" inside the SVG icons area
                const iconsArea = $el.find('.d-inline-flex').text().toLowerCase();
                
                if (locationRaw.toLowerCase().includes('remoto') || locationRaw.toLowerCase().includes('home office') || iconsArea.includes('teletrabalho') || iconsArea.includes('remoto')) {
                    isRemote = true;
                    location = 'Remoto';
                } else if (title.toLowerCase().includes('remoto') || title.toLowerCase().includes('home office')) {
                    isRemote = true;
                    location = 'Remoto';
                }

                if (!uniqueJobsMap.has(link)) {
                    uniqueJobsMap.set(link, {
                        title, company, location, is_remote: isRemote, url: link, source: 'Infojobs',
                        description: descriptionSnippet.substring(0, 250) + (descriptionSnippet.length > 250 ? '...' : '')
                    });
                }
            }
        });

        const extractedJobs = Array.from(uniqueJobsMap.values());
        jobs.push(...extractedJobs);

        console.log(`[Infojobs] Sucesso! Foram formatadas ${jobs.length} vagas de UX/UI válidas e não-confidenciais.`);

    } catch (error) {
        console.error('[Infojobs] Erro crítico no motor:', error.message);
    }
    
    return jobs;
}

module.exports = scrapeInfojobs;
