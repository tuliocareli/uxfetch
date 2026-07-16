const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeSolides() {
    console.log('[Sólides] Iniciando scraping via API V3...');
    const jobs = [];
    const MAX_PAGES = 5; // 14 vagas por página = 70 por query
    const queries = ['ux', 'product design', 'designer', 'design research', 'design system', 'ux researcher', 'ux research', 'graphic design', 'motion design',  'ux writer', 'head de design']; 
    const extractedJobs = [];

    // Filtros rigorosos para Produto/Design
    const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|diretor\s+de\s+arte|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|motion\s+graphics|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|designer\b|videomaker|editor(a)?\s+de\s+v[ií]deo|audiovisual|edi[çc][ãa]o\s+de\s+v[ií]deo)/i;
    
    const excludeKeywords = [
        'desenvolvedor', 'developer', 'arquiteto', 'architect', 
        'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
        'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
                'moda', 'interiores', 'produto físico', 'embalagem',   'performance'
    , 'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'
        ];

    try {
        // 1. Varredura Inteligente por Queries
        for (const query of queries) {
            console.log(`[Sólides] Buscando vagas para o termo: "${query}"...`);
            for (let page = 1; page <= MAX_PAGES; page++) {
                
                // Delay Estocástico (Compliance) entre as requisições de página
                if (page > 1 || queries.indexOf(query) > 0) {
                    const delayMs = Math.floor(Math.random() * (3500 - 1500 + 1)) + 1500;
                    await new Promise(r => setTimeout(r, delayMs));
                }

                const url = `https://apigw.solides.com.br/jobs/v3/portal-vacancies-new?title=${encodeURIComponent(query)}&take=14&page=${page}`;
                const { data } = await axios.get(url, { timeout: 10000 });

                if (!data || !data.data || !data.data.data || data.data.data.length === 0) break;
                
                extractedJobs.push(...data.data.data);
                
                // Se a paginação do backend acabou, aborta o loop da query
                if (page >= data.data.totalPages) break;
            }
        }

        // 2. Remoção de duplicatas entre as buscas cruzadas
        const uniqueJobsMap = new Map();
        for (const j of extractedJobs) {
            if (j.id) uniqueJobsMap.set(j.id, j);
        }
        const uniqueJobs = Array.from(uniqueJobsMap.values());
        
        console.log(`[Sólides] Encontradas ${uniqueJobs.length} vagas brutas na API. Aplicando filtros triplos...`);

        // 3. Filtro Rigoroso por Título
        for (let job of uniqueJobs) {
            const t = (job.title || '').toLowerCase();
            
            // Camada 1: Rejeição Imediata
            const isExcluded = excludeKeywords.some(bad => t.includes(bad));
            if (isExcluded) continue;

            // Camada 2: Aceitação por Título
            const matchesTitle = includeRegex.test(t);
            if (!matchesTitle) continue;

            // O Payload da Sólides já inclui a descrição (Não precisamos bater na API individualmente)
            const rawDesc = job.description || '';
            const $ = cheerio.load(rawDesc);
            let fullText = $('body').text().replace(/\s+/g, ' ').trim();

            // Capturar apenas o resumo útil inicial (Isca)
            let excerpt = fullText.substring(0, 250).trim();
            if (excerpt.length > 10) {
                excerpt = excerpt + '...';
            } else {
                excerpt = `Oportunidade de ${job.title} na ${job.companyName || 'Empresa Confidencial'}. Confira todos os detalhes acessando o link da vaga oficial.`;
            }

            // Normalizar a Localização e Modo de Trabalho
            let location = 'A Combinar';
            let workMode = 'in_person';
            
            if (job.homeOffice) {
                location = 'Remoto';
                workMode = 'remote';
            } else {
                if (job.city && job.state) location = `${job.city.name}/${job.state.code}`;
                const textLower = fullText.toLowerCase() + ' ' + t;
                if (textLower.includes('híbrid') || textLower.includes('hibrid') || textLower.includes('a consultar')) {
                    workMode = 'hybrid';
                } else if (textLower.includes('remoto') || textLower.includes('100% remoto') || textLower.includes('home office') || textLower.includes('home-office')) {
                    workMode = 'remote';
                    location = location === 'A Combinar' ? 'Remoto' : location;
                }
            }

            // Constrói a URL no portal CENTRAL da Sólides usando o slug do título.
            // O subdomínio empresa.solides.jobs é deletado quando a vaga fecha.
            // O portal central vagas.solides.com.br/vagas/todos/{slug} é permanente.
            const titleSlug = job.title
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
                .replace(/[^a-z0-9\s-]/g, '')                     // Remove caracteres especiais
                .trim()
                .replace(/\s+/g, '-');                             // Espaços → hífens
            const jobUrl = `https://vagas.solides.com.br/vaga/${job.id}/${titleSlug}`;

            jobs.push({
                title: job.title,
                company: job.companyName || 'Empresa Confidencial',
                location: location,
                is_remote: job.homeOffice || workMode === 'remote',
                work_mode: workMode,
                url: jobUrl,
                source: 'Sólides',
                description: excerpt
            });
        }

        console.log(`[Sólides] Sucesso! Foram formatadas ${jobs.length} vagas exclusivas e validadas.`);

    } catch (error) {
        console.error('[Sólides] Erro crítico no motor:', error.message);
    }
    
    return jobs;
}

module.exports = scrapeSolides;
