const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeTrampos() {
    console.log('[Trampos] Iniciando scraping via API JSON...');
    const jobs = [];
    const MAX_PAGES = 5;
    const extractedJobs = [];

    // Filtros rigorosos para Produto/Design
    const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|motion\s+graphics|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|designer\b|videomaker|editor(a)?\s+de\s+v[ií]deo|audiovisual|edi[çc][ãa]o\s+de\s+v[ií]deo)/i;
    
    const excludeKeywords = [
        'desenvolvedor', 'developer', 'arquiteto', 'architect', 
        'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
        'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
                'moda', 'interiores', 'produto físico', 'embalagem',   'performance'
    , 'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'
        ];

    try {
        // 1. Varredura em massa nas páginas recentes da API
        for (let page = 1; page <= MAX_PAGES; page++) {
            console.log(`[Trampos] Baixando página ${page}...`);
            const { data } = await axios.get(`https://trampos.co/api/v2/opportunities?page=${page}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            
            if (!data.opportunities || data.opportunities.length === 0) break;
            
            extractedJobs.push(...data.opportunities);
        }

        // Remoção de possíveis duplicatas que a própria API envie entre páginas
        const uniqueJobs = Array.from(new Map(extractedJobs.map(j => [j.id, j])).values());
        
        console.log(`[Trampos] Encontradas ${uniqueJobs.length} vagas totais na API. Aplicando filtros...`);

        // 2. Filtro em memória inteligente
        const filtered = uniqueJobs.map(job => {
            const t = (job.name || '').toLowerCase();
            const isExcluded = excludeKeywords.some(bad => t.includes(bad));
            if (isExcluded) return null;
            
            // Aceitação por Título
            const matchesTitle = includeRegex.test(t);
            if (!matchesTitle) return null;
            
            job.needsDeepCheck = false;
            return job;
        }).filter(Boolean);

        console.log(`[Trampos] Sobraram ${filtered.length} vagas aprovadas no filtro de Design. Buscando descrições completas...`);

        // 3. Extração dos detalhes com Rate Limiting Estocástico (Compliance)
        for (let job of filtered) {
            try {
                // Delay randômico entre 1.5s e 3.5s para poupar os servidores da Trampos
                const delayMs = Math.floor(Math.random() * (3500 - 1500 + 1)) + 1500;
                await new Promise(r => setTimeout(r, delayMs));

                const { data } = await axios.get(`https://trampos.co/api/v2/opportunities/${job.id}`, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                });

                const rawDesc = data.opportunity.description || '';
                
                // Limpar possíveis HTMLs sujos (mesmo vindo da API, o campo pode ser Rich Text)
                const $ = cheerio.load(rawDesc);
                let fullText = $('body').text().replace(/\s+/g, ' ').trim();
                

                
                // Capturar apenas o resumo útil inicial (Isca)
                let excerpt = fullText.substring(0, 250).trim();
                if (excerpt.length > 10) {
                    excerpt = excerpt + '...';
                } else {
                    excerpt = `Oportunidade de ${job.name} na ${job.company?.name || 'Empresa Confidencial'}. Acesse o link para conferir os detalhes desta vaga.`;
                }

                // Normalizar Localização e Work Mode
                let location = 'A Combinar';
                let workMode = 'in_person';

                if (job.home_office) {
                    location = 'Remoto';
                    workMode = 'remote';
                } else {
                    if (job.city && job.state) {
                        location = `${job.city}/${job.state}`;
                    } else if (job.state) {
                        location = job.state;
                    }
                    const textLower = fullText.toLowerCase();
                    if (textLower.includes('híbrid') || textLower.includes('hibrid')) {
                        workMode = 'hybrid';
                    }
                }

                // Construção final do modelo exigido pelo Supabase
                jobs.push({
                    title: job.name,
                    company: job.company?.name || 'Empresa Confidencial',
                    location: location,
                    is_remote: job.home_office || false,
                    work_mode: workMode,
                    url: `https://trampos.co/oportunidades/${job.id}`, // Link público do site, e não da API
                    source: 'Trampos',
                    description: excerpt
                });

            } catch (err) {
                console.error(`[Trampos] Erro ao extrair detalhes da vaga ${job.id}:`, err.message);
            }
        }

        console.log(`[Trampos] Sucesso! Foram formatadas ${jobs.length} vagas exclusivas.`);

    } catch (error) {
        console.error('[Trampos] Erro crítico no motor:', error.message);
    }
    
    return jobs;
}

module.exports = scrapeTrampos;
