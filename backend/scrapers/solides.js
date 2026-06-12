const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeSolides() {
    console.log('[Sólides] Iniciando scraping via API V3...');
    const jobs = [];
    const MAX_PAGES = 5; // 14 vagas por página = 70 por query
    const queries = ['ux', 'product design', 'designer']; 
    const extractedJobs = [];

    // Filtros rigorosos para Produto/Design
    const includeRegex = /\b(ux|ui|product design|product designer|design engineer|research|researcher|design ops|staff designer)\b/i;
    const genericIncludeRegex = /\b(designer|design)\b/i;
    
    const excludeKeywords = [
        'desenvolvedor', 'developer', 'arquiteto', 'architect', 
        'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
        'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data',
        'gráfico', 'graphic', 'motion', 'video', 'vídeo', 'audiovisual', '3d', 'moda', 'interiores', 'produto físico', 'embalagem', 'marketing', 'social media', 'performance'
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

        // 3. Filtro Triplo (Rejeição, Aceitação e Deep Check)
        for (let job of uniqueJobs) {
            const t = (job.title || '').toLowerCase();
            
            // Camada 1: Rejeição Imediata
            const isExcluded = excludeKeywords.some(bad => t.includes(bad));
            if (isExcluded) continue;

            const isExactMatch = includeRegex.test(t);
            const isGenericMatch = genericIncludeRegex.test(t);
            
            let needsDeepCheck = false;
            
            // Camada 2: Aceitação ou Agendamento de Deep Check
            if (isExactMatch) {
                needsDeepCheck = false;
            } else if (isGenericMatch) {
                needsDeepCheck = true;
            } else {
                continue; // Passa direto se não for nem UX nem Design Genérico
            }

            // O Payload da Sólides já inclui a descrição (Não precisamos bater na API individualmente)
            const rawDesc = job.description || '';
            const $ = cheerio.load(rawDesc);
            let fullText = $('body').text().replace(/\s+/g, ' ').trim();

            // Camada 3: Deep Check Semântico na Descrição
            if (needsDeepCheck) {
                const descLower = fullText.toLowerCase();
                const hasUxUiKeywords = /\b(ux|ui|interface|usabilidade|figma|product|produto digital|app|aplicativo|web)\b/i.test(descLower);
                if (!hasUxUiKeywords) {
                    console.log(`[Sólides] ❌ Vaga descartada após ler a descrição (não é UX/UI): ${job.title}`);
                    continue; // Pula essa vaga
                }
                console.log(`[Sólides] ✅ Vaga genérica validada pela descrição: ${job.title}`);
            }

            // Capturar apenas o resumo útil inicial (Isca)
            let excerpt = fullText.substring(0, 250).trim();
            if (excerpt.length > 10) {
                excerpt = excerpt + '...';
            } else {
                excerpt = `Oportunidade de ${job.title} na ${job.companyName || 'Empresa Confidencial'}. Confira todos os detalhes acessando o link da vaga oficial.`;
            }

            // Normalizar a Localização
            let location = 'A Combinar';
            if (job.homeOffice) {
                location = 'Remoto';
            } else if (job.city && job.state) {
                location = `${job.city.name}/${job.state.code}`;
            }

            jobs.push({
                title: job.title,
                company: job.companyName || 'Empresa Confidencial',
                location: location,
                is_remote: job.homeOffice || false,
                url: job.redirectLink || `https://vagas.solides.com.br/vaga/${job.id}`,
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
