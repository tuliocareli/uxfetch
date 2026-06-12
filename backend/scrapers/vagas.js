const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeVagas() {
    console.log('[Vagas.com.br] Iniciando scraping na rota principal de UX/Design...');
    const jobs = [];
    const url = 'https://www.vagas.com.br/vagas-de-ux-design';
    
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
                'User-Agent': 'Mozilla/5.0'
            }
        });
        const $ = cheerio.load(data);
        const uniqueJobsMap = new Map();

        $('.vaga, article, li.vaga').each((i, el) => {
            const $el = $(el);
            // Pega apenas do link principal para evitar duplicação
            let title = $el.find('.link-detalhes-vaga').text().replace(/\s+/g, ' ').trim() || $el.find('.cargo').text().replace(/\s+/g, ' ').trim();
            const company = $el.find('.empresa, .emprVaga').text().replace(/\s+/g, ' ').trim() || 'Confidencial';
            const locationRaw = $el.find('.localizacao, .cidade, .vaga-local').text().replace(/\s+/g, ' ').trim() || '';
            const descriptionSnippet = $el.find('.detalhes, .resumo, p').text().replace(/\s+/g, ' ').trim() || `Vaga de ${title} na empresa ${company}.`;
            
            let link = $el.find('a').attr('href') || $el.attr('href');
            if (link && link.startsWith('/')) {
                link = 'https://www.vagas.com.br' + link;
            }

            if (title && link) {
                const t = title.toLowerCase();
                const hasUxUi = includeRegex.test(t);
                const isExcluded = excludeKeywords.some(bad => t.includes(bad));

                if (isExcluded) return;
                if (!hasUxUi && !t.includes('designer')) return;

                let isRemote = false;
                let location = locationRaw || 'A Combinar';
                if (locationRaw.toLowerCase().includes('remoto') || locationRaw.toLowerCase().includes('home office')) {
                    isRemote = true;
                    location = 'Remoto';
                } else if (title.toLowerCase().includes('remoto') || title.toLowerCase().includes('home office')) {
                    isRemote = true;
                    location = 'Remoto';
                }

                if (!isRemote && location !== 'A Combinar') {
                    location = location.split('-')[0].split('A empresa')[0].trim();
                }

                if (!uniqueJobsMap.has(link)) {
                    uniqueJobsMap.set(link, {
                        title, company, location, is_remote: isRemote, url: link, source: 'Vagas.com.br',
                        description: descriptionSnippet.substring(0, 250) + (descriptionSnippet.length > 250 ? '...' : '')
                    });
                }
            }
        });

        const extractedJobs = Array.from(uniqueJobsMap.values());
        jobs.push(...extractedJobs);

        console.log(`[Vagas.com.br] Sucesso! Foram formatadas ${jobs.length} vagas de UX/UI exclusivas e validadas.`);
    } catch (error) {
        console.error('[Vagas.com.br] Erro crítico no motor:', error.message);
    }
    return jobs;
}

module.exports = scrapeVagas;
