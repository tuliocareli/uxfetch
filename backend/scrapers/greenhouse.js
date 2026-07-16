const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

const delay = ms => new Promise(res => setTimeout(res, ms));

async function translateWithGemini(htmlContent) {
    if (!genAI) {
        console.warn('[Greenhouse] Aviso: GEMINI_API_KEY não configurada. Pulando tradução.');
        return null;
    }
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Crie um resumo curto e atrativo desta vaga de UX/UI/Product Design em Português do Brasil.
IMPORTANTE:
- Escreva no MÁXIMO 2 ou 3 frases curtas (cerca de 120 caracteres, ideal para um card pequeno).
- Retorne APENAS TEXTO PURO. É estritamente proibido retornar tags HTML, imagens, links ou markdown.
- Termine o texto com "..." (reticências).
- Não traduza jargões técnicos da área de design e tecnologia (ex: wireframe, mockup, hand-off, UI kit).

HTML da vaga original:
${htmlContent}`;
        const result = await model.generateContent(prompt);
        let translatedText = result.response.text();
        translatedText = translatedText.replace(/\n+/g, ' ').trim();
        return translatedText;
    } catch (error) {
        console.error('[Greenhouse] Erro ao traduzir com Gemini:', error.message);
        return null;
    }
}

async function scrapeGreenhouse() {
    console.log('[Greenhouse] Iniciando scraping via API pública...');
    let allJobs = [];

    const companies = [
        { id: 'nubank', name: 'Nubank' },
        { id: 'quintoandar', name: 'QuintoAndar' },
        { id: 'inter', name: 'Inter' },
        { id: 'vtex', name: 'VTEX' },
        { id: 'wildlifestudios', name: 'Wildlife Studios' },
        { id: 'c6bank', name: 'C6 Bank' },
        { id: 'ebanx', name: 'EBANX' },
        { id: 'gympass', name: 'Gympass' },
        { id: 'rdstation', name: 'RD Station' },
        { id: 'stone', name: 'Stone' },
        { id: 'sumup', name: 'SumUp' },
        { id: 'zenvia', name: 'Zenvia' },
        { id: 'thoughtworks', name: 'ThoughtWorks' },
        { id: 'bitso', name: 'Bitso' },
        { id: 'blip-global', name: 'Blip Global' },
        { id: 'arcoeducacao', name: 'Arco Educação' },
        { id: 'figma', name: 'Figma' },
        { id: 'xpinc', name: 'XP Inc' }
    ];

    const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|diretor\s+de\s+arte|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|motion\s+graphics|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|designer\b|videomaker|editor(a)?\s+de\s+v[ií]deo|audiovisual|edi[çc][ãa]o\s+de\s+v[ií]deo)/i;
    const excludeKeywords = [
        'desenvolvedor', 'developer', 'arquiteto', 'architect', 
        'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
        'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
                'moda', 'interiores', 'produto físico', 'embalagem',   'performance',
        'sobrancelha', 'sobrancelhas', 'unha', 'unhas', 'cílios', 'cilios', 'micropigmentação'
    , 'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'
        ];

    for (const company of companies) {
        try {
            console.log(`[Greenhouse] Buscando vagas para ${company.name}...`);
            const response = await axios.get(`https://api.greenhouse.io/v1/boards/${company.id}/jobs?content=true`, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.data || !response.data.jobs) {
                console.log(`[Greenhouse] Formato inesperado para ${company.name}.`);
                continue;
            }

            const jobs = response.data.jobs;
            let count = 0;

            for (const job of jobs) {
                const title = job.title || '';
                const titleLower = title.toLowerCase();
                const locationRaw = (job.location && job.location.name) ? job.location.name : '';
                const locationLower = locationRaw.toLowerCase();

                // Filtro Local
                const isDesign = includeRegex.test(titleLower);
                const isExcluded = excludeKeywords.some(k => titleLower.includes(k));

                if (isDesign && !isExcluded) {
                    // Modalidade
                    let work_mode = 'in_person';
                    if (titleLower.includes('remot') || locationLower.includes('remot')) {
                        work_mode = 'remote';
                    } else if (titleLower.includes('híbrid') || titleLower.includes('hybrid') || locationLower.includes('hybrid') || locationLower.includes('híbrid')) {
                        work_mode = 'hybrid';
                    }

                    let is_international = false;
                    const brazilKeywords = ['brazil', 'brasil', 'br', 'são paulo', 'sp', 'mg', 'rj', 'sc', 'pr', 'rs', 'bh', 'belo horizonte'];
                    if (locationLower) {
                        const isBrazil = brazilKeywords.some(k => locationLower.includes(k));
                        
                        // Detect multi-country locations separated by ;
                        const locationsList = locationLower.split(';');
                        const hasForeignLocation = locationsList.some(loc => {
                            const l = loc.trim();
                            return l.length > 0 && !brazilKeywords.some(k => l.includes(k));
                        });

                        if (hasForeignLocation || (!isBrazil && locationRaw.trim() !== '')) {
                            is_international = true;
                        }
                    }

                    // Forçamos Internacional se a vaga disser Explicitamente
                    if (titleLower.includes('anywhere in the world') || titleLower.includes('global') || locationLower.includes('anywhere')) {
                        is_international = true;
                    }

                    // Tratamento local genérico para vagas remotas
                    let finalLocation = locationRaw;
                    if (work_mode === 'remote') {
                        finalLocation = 'Remoto';
                    }

                    // Descrição
                    let description = 'Vaga encontrada pelo UX Fetch.';
                    if (job.content) {
                        if (is_international) {
                            console.log(`[Greenhouse] Vaga internacional encontrada: ${title}. Iniciando tradução com Gemini...`);
                            const translated = await translateWithGemini(job.content);
                            if (translated) {
                                description = translated;
                                await delay(4000); // Respeitar Rate Limit
                            } else {
                                // Fallback se o Gemini falhar
                                const decodedHtml = job.content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                                const cleanHtml = decodedHtml.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
                                if (cleanHtml) description = cleanHtml.substring(0, 150).trim() + '...';
                            }
                        } else {
                            // Vaga nacional, apenas limpa o HTML
                            const decodedHtml = job.content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
                            const cleanHtml = decodedHtml.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
                            if (cleanHtml) description = cleanHtml.substring(0, 150).trim() + '...';
                        }
                    }

                    allJobs.push({
                        title: title,
                        company: company.name,
                        location: finalLocation || 'Não informado',
                        url: job.absolute_url,
                        source: 'Greenhouse',
                        work_mode: work_mode,
                        is_remote: work_mode === 'remote',
                        is_international: is_international,
                        description: description
                    });
                    count++;
                }
            }
            console.log(`[Greenhouse] ${count} vagas de UX aprovadas para ${company.name}.`);
        } catch (error) {
            console.error(`[Greenhouse] Erro ao buscar ${company.name}:`, error.message);
        }
    }

    // Remover duplicatas caso existam
    const uniqueJobs = [];
    allJobs.forEach(job => {
        if (!uniqueJobs.find(j => j.url === job.url)) {
            uniqueJobs.push(job);
        }
    });

    console.log(`[Greenhouse] Sucesso! Foram formatadas ${uniqueJobs.length} vagas totais exclusivas.`);
    return uniqueJobs;
}

module.exports = scrapeGreenhouse;
