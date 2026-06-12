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
    const includeRegex = /\b(ux|ui|product design|product designer|design engineer|research|researcher|design ops|staff designer)\b/i;
    const genericIncludeRegex = /\b(designer|design)\b/i;
    
    const excludeKeywords = [
        'desenvolvedor', 'developer', 'arquiteto', 'architect', 
        'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
        'backend', 'fullstack', 'full stack', 'data', 'qa', 'tester',
        'gráfico', 'graphic', 'motion', 'video', 'vídeo', 'audiovisual', '3d', 'moda', 'interiores', 'produto físico', 'embalagem', 'marketing', 'social media', 'performance',
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
            
            if (isExcluded && !hasUxUi) {
                continue;
            }

            const isGenericMatch = genericIncludeRegex.test(t);
            let needsDeepCheck = false;
            
            // Aceitação
            if (hasUxUi) {
                needsDeepCheck = false;
            } else if (isGenericMatch || t.includes('front-end') || t.includes('frontend')) {
                // Front-end que não explicitou UX no título, ou "Designer" genérico
                needsDeepCheck = true;
            } else {
                continue;
            }

            let descriptionSnippet = `Oportunidade na ${job.company} via Programathor.`;
            
            // Camada 3: Deep Check (Entrar na vaga para ver se menciona Design/UX/Figma)
            if (needsDeepCheck) {
                try {
                    // Delay para não sobrecarregar
                    await new Promise(r => setTimeout(r, 1000));
                    const { data: jobData } = await axios.get(job.link, { timeout: 10000 });
                    const $job = cheerio.load(jobData);
                    
                    const description = $job('.wrapper-content-job-show').text() || $job('body').text();
                    const descLower = description.toLowerCase();
                    
                    // Removido "web" e "app" pois vagas puras de front-end sempre têm isso
                    const hasUxUiKeywords = /\b(ux|ui|interface|usabilidade|figma|product design|produto digital)\b/i.test(descLower);
                    
                    if (!hasUxUiKeywords) {
                        console.log(`[Programathor] ❌ Vaga descartada (não menciona UX/UI na descrição): ${job.title}`);
                        continue;
                    }
                    console.log(`[Programathor] ✅ Vaga validada pela descrição: ${job.title}`);
                    
                    // Extrair um snippet real
                    let textClean = description.replace(/\s+/g, ' ').trim();
                    if (textClean.length > 250) textClean = textClean.substring(0, 250) + '...';
                    descriptionSnippet = textClean;
                    
                } catch (e) {
                    console.error(`[Programathor] Falha ao acessar vaga ${job.link} para deep check:`, e.message);
                    // Em caso de falha no deep check de front-end, pulamos a vaga por segurança
                    continue;
                }
            }

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
