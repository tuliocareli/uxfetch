const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeGupy() {
    console.log('[Gupy] Iniciando scraping via API Oculta V1...');
    const jobs = [];
    const MAX_PAGES = 5; // 50 vagas por página = 250 por query
    const LIMIT = 50;
    const queries = ['ux', 'product design', 'designer', 'design research', 'design system', 'ux researcher', 'ux research', 'graphic design', 'motion design',  'ux writer', 'head de design']; 
    const extractedJobs = [];

    // Filtros rigorosos para Produto/Design
    const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|motion\s+graphics|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|designer\b|videomaker|editor(a)?\s+de\s+v[ií]deo|audiovisual|edi[çc][ãa]o\s+de\s+v[ií]deo)/i;
    
    // Gupy possui muitas vagas de salão de beleza e design genérico não-digital
    const excludeKeywords = [
        'desenvolvedor', 'developer', 'arquiteto', 'architect', 
        'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
        'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
                'moda', 'interiores', 'produto físico', 'embalagem',   'performance',
        'sobrancelha', 'sobrancelhas', 'unha', 'unhas', 'cílios', 'cilios', 'micropigmentação'
    , 'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'
        ];

    try {
        // 1. Varredura por Queries
        for (const query of queries) {
            console.log(`[Gupy] Buscando vagas para o termo: "${query}"...`);
            for (let page = 0; page < MAX_PAGES; page++) {
                
                const offset = page * LIMIT;

                // Delay Estocástico (Compliance) entre as requisições de página
                if (page > 0 || queries.indexOf(query) > 0) {
                    const delayMs = Math.floor(Math.random() * (4000 - 2000 + 1)) + 2000;
                    await new Promise(r => setTimeout(r, delayMs));
                }

                const url = `https://employability-portal.gupy.io/api/v1/jobs?jobName=${encodeURIComponent(query)}&limit=${LIMIT}&offset=${offset}`;
                const { data } = await axios.get(url, {
                    timeout: 10000,
                    headers: { 'Accept': 'application/json' }
                });

                if (!data || !data.data || data.data.length === 0) break;
                
                extractedJobs.push(...data.data);
                
                // Se a API retornou menos que o limit, estamos na última página
                if (data.data.length < LIMIT) break;
            }
        }

        // 2. Remoção de duplicatas (pois o termo 'designer' pode trazer vagas de 'ux')
        const uniqueJobsMap = new Map();
        for (const j of extractedJobs) {
            if (j.id) uniqueJobsMap.set(j.id, j);
        }
        const uniqueJobs = Array.from(uniqueJobsMap.values());
        
        console.log(`[Gupy] Encontradas ${uniqueJobs.length} vagas brutas na API. Aplicando filtros triplos...`);

        // 3. Filtro Rigoroso por Título
        for (let job of uniqueJobs) {
            const t = (job.name || '').toLowerCase();
            
            // Camada 1: Rejeição Imediata
            const isExcluded = excludeKeywords.some(bad => t.includes(bad));
            if (isExcluded) continue;

            // Camada 2: Aceitação por Título
            const matchesTitle = includeRegex.test(t);
            if (!matchesTitle) continue;

            // A Gupy já manda a description no JSON primário!
            const rawDesc = job.description || '';
            const $ = cheerio.load(rawDesc);
            let fullText = $('body').text().replace(/\s+/g, ' ').trim();

            // Capturar resumo
            let excerpt = fullText.substring(0, 250).trim();
            if (excerpt.length > 10) {
                excerpt = excerpt + '...';
            } else {
                excerpt = `Oportunidade de ${job.name} na ${job.careerPageName || 'Empresa Confidencial'}. Confira todos os detalhes acessando o link oficial da Gupy.`;
            }

            // Normalizar a Localização e Modo de Trabalho
            let location = 'A Combinar';
            let workMode = 'in_person'; // Default
            
            const isRemote = job.isRemoteWork || job.workplaceType === 'remote';
            
            if (isRemote) {
                location = 'Remoto';
                workMode = 'remote';
            } else if (job.workplaceType === 'hybrid') {
                workMode = 'hybrid';
                if (job.city && job.state) location = `${job.city}/${job.state}`;
            } else {
                workMode = 'in_person';
                if (job.city && job.state) location = `${job.city}/${job.state}`;
            }

            jobs.push({
                title: job.name,
                company: job.careerPageName || 'Empresa Confidencial',
                location: location,
                is_remote: isRemote || false,
                work_mode: workMode,
                url: job.jobUrl || `https://portal.gupy.io/job-search/term=${encodeURIComponent(job.name)}`,
                source: 'Gupy',
                description: excerpt
            });
        }

        console.log(`[Gupy] Sucesso! Foram formatadas ${jobs.length} vagas exclusivas e validadas.`);

    } catch (error) {
        console.error('[Gupy] Erro crítico no motor:', error.message);
    }
    
    return jobs;
}

module.exports = scrapeGupy;
