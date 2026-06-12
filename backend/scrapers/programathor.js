const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeProgramathor() {
    console.log('[Programathor] Iniciando scraping nas rotas de Design e Front-End...');
    const jobs = [];
    const urls = [
        'https://programathor.com.br/jobs-design',
        'https://programathor.com.br/jobs-front-end'
    ];
    
    // Expressões regulares e palavras de exclusão para UX Fetch
    const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?)/i;
    
    const excludeKeywords = [
        'desenvolvedor', 'developer', 'arquiteto', 'architect', 
        'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
        'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
        'gráfico', 'grafico', 'graphic', 'motion', 'video', 'vídeo', 'audiovisual', '3d', 'moda', 'interiores', 'produto físico', 'embalagem', 'marketing', 'social media', 'performance',
        'sobrancelha', 'sobrancelhas', 'unha', 'unhas', 'cílios', 'cilios', 'micropigmentação'
    ];

    try {
        const uniqueJobsMap = new Map();

        for (const url of urls) {
            console.log(`[Programathor] Buscando em: ${url}`);
            const { data } = await axios.get(url, {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);

            $('.cell-list').each((i, el) => {
                let title = $(el).find('h3').text().replace(/\s+/g, ' ').replace('NOVA', '').trim();
                const company = $(el).find('.cell-list-content-icon span').first().text().trim() || 'Desconhecida';
                const locationAndRemote = $(el).find('.cell-list-content-icon').text().replace(/\s+/g, ' ').trim();
                
                let link = $(el).attr('href') || $(el).find('a').attr('href');
                if (link && link.startsWith('/')) {
                    link = 'https://programathor.com.br' + link;
                }

                if (title && link) {
                    uniqueJobsMap.set(link, { title, company, locationAndRemote, link });
                }
            });
        }

        const extractedJobs = Array.from(uniqueJobsMap.values());
        console.log(`[Programathor] Encontradas ${extractedJobs.length} vagas brutas nas listagens. Aplicando filtros...`);

        for (let job of extractedJobs) {
            const t = job.title.toLowerCase();
            
            // Camada 1: Rejeição Imediata
            // Se a vaga tem "Vencida", já descartamos.
            if (t.includes('vencida')) continue;

            const hasUxUi = includeRegex.test(t);
            const isExcluded = excludeKeywords.some(bad => t.includes(bad));
            
            if (isExcluded) continue;
            if (!hasUxUi) continue;

            let descriptionSnippet = `Oportunidade na ${job.company} via Programathor.`;

            // Normalizar a Localização
            const isRemote = job.locationAndRemote.includes('Remoto');
            let location = 'A Combinar';
            if (isRemote) {
                location = 'Remoto';
            } else {
                // Tenta extrair a cidade se houver padrão, ex: "São Paulo (Presencial)"
                // Como pode ser complexo, simplificaremos para Presencial/Híbrido
                location = 'Presencial/Híbrido';
            }

            jobs.push({
                title: job.title,
                company: job.company,
                location: location,
                is_remote: isRemote,
                url: job.link,
                source: 'Programathor',
                description: descriptionSnippet
            });
        }

        console.log(`[Programathor] Sucesso! Foram formatadas ${jobs.length} vagas de UX/UI exclusivas e validadas.`);

    } catch (error) {
        console.error('[Programathor] Erro crítico no motor:', error.message);
    }
    
    return jobs;
}

module.exports = scrapeProgramathor;
