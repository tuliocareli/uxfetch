const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Inicializa o Gemini
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Helper para delay de segurança da API
const delay = ms => new Promise(res => setTimeout(res, ms));

async function translateWithGemini(htmlContent) {
    if (!genAI) {
        console.warn('[WWR] Aviso: GEMINI_API_KEY não configurada. Pulando tradução.');
        const plainText = cheerio.load(htmlContent).text().replace(/\s+/g, ' ').trim();
        return plainText.length > 130 ? plainText.substring(0, 130) + '...' : plainText;
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
        
        // Remove quebras de linha duplas e espaços extras
        translatedText = translatedText.replace(/\\n+/g, ' ').trim();
        return translatedText;
    } catch (error) {
        console.error('[WWR] Erro ao traduzir com Gemini:', error.message);
        // Em caso de falha na API, removemos o HTML e resumimos manualmente para não quebrar o layout
        const plainText = cheerio.load(htmlContent).text().replace(/\s+/g, ' ').trim();
        return plainText.length > 130 ? plainText.substring(0, 130) + '...' : plainText;
    }
}

async function scrapeWWR() {
    console.log('[WWR] Iniciando scraping do We Work Remotely (Feed de Design)...');
    const jobs = [];
    const url = 'https://weworkremotely.com/categories/remote-design-jobs.rss';
    
    // Filtros de região aceitos para brasileiros
    const allowedRegions = ["anywhere", "worldwide", "latin america", "americas", "brazil", "global"];
    
    // Regex de perfis do UX Fetch
    const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|designer\b)/i;
    
    // Exclusões de lixo/outras áreas
    const excludeKeywords = [
        'desenvolvedor', 'developer', 'arquiteto', 'architect', 
        'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
        'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
                'moda', 'interiores', 'produto físico', 'embalagem',   'performance',
        'sobrancelha', 'sobrancelhas', 'unha', 'unhas', 'cílios', 'cilios', 'micropigmentação'
    , 'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'
        ];

    try {
        const { data } = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 UXFetch/1.0'
            }
        });

        // Parser de XML nativo do Cheerio
        const $ = cheerio.load(data, { xmlMode: true });
        const items = $('item').toArray();
        
        console.log(`[WWR] Encontrados ${items.length} itens no feed RSS.`);

        for (const el of items) {
            const rawTitle = $(el).find('title').text().trim();
            const region = $(el).find('region').text().trim();
            const descriptionHtml = $(el).find('description').text().trim();
            const link = $(el).find('link').text().trim();
            
            // O título vem como "Company: Job Title". Vamos separar.
            let company = 'Desconhecida';
            let jobTitle = rawTitle;
            if (rawTitle.includes(': ')) {
                const parts = rawTitle.split(': ');
                company = parts[0].trim();
                jobTitle = parts.slice(1).join(': ').trim();
            }

            // 1. Parse Defensivo (Falso Positivo de Região)
            const titleUpper = jobTitle.toUpperCase();
            if (titleUpper.includes('USA ONLY') || titleUpper.includes('US ONLY') || titleUpper.includes('UNITED STATES ONLY')) {
                continue;
            }

            // 2. Filtro Geográfico
            const locStr = (region + ' ' + jobTitle).toLowerCase();
            const matchesRegion = allowedRegions.some(allowed => locStr.includes(allowed));
            if (!matchesRegion) {
                continue;
            }

            // 3. Filtro de Especialidade (UX/UI)
            const t = jobTitle.toLowerCase();
            const hasUxUi = includeRegex.test(t);
            const isExcluded = excludeKeywords.some(bad => t.includes(bad));
            
            if (isExcluded || !hasUxUi) {
                continue;
            }

            // 4. Detecção de Vagas Brasileiras (Lyncas, CI&T, etc) no WWR
            // Se o título tem termos típicos de vagas BR, marcamos como nacional e pulamos a tradução!
            const ptBrKeywords = /\b(sênior|júnior|vaga|pessoa|brasil|designer de)\b/i;
            const isBrazilian = ptBrKeywords.test(jobTitle);

            let finalDescription = descriptionHtml;
            
            if (isBrazilian) {
                console.log(`[WWR] Vaga identificada como Brasileira: ${jobTitle}. Extraindo texto limpo (sem tradução)...`);
                // Como não passamos pelo Gemini, precisamos limpar o HTML e resumir manualmente via Cheerio
                const plainText = cheerio.load(descriptionHtml).text().replace(/\s+/g, ' ').trim();
                finalDescription = plainText.length > 130 ? plainText.substring(0, 130) + '...' : plainText;
            } else {
                // A vaga passou por todos os filtros e é internacional. Vamos traduzir!
                console.log(`[WWR] Vaga internacional encontrada: ${jobTitle} na ${company} (${region}). Iniciando tradução...`);
                finalDescription = await translateWithGemini(descriptionHtml);
                
                console.log(`[WWR] Tradução concluída. Aguardando 4 segundos para respeitar Rate Limit da API...`);
                await delay(4000); // 4 segundos cravados para o rate limit apenas nas traduções
            }
            
            jobs.push({
                title: jobTitle, // Mantém o título original sem traduzir
                company: company,
                location: region, 
                is_remote: true, // Sempre remoto
                work_mode: 'remote',
                url: link,
                source: 'We Work Remotely',
                description: finalDescription,
                is_international: !isBrazilian // Fica 'false' se for vaga brasileira
            });
        }

        console.log(`[WWR] Sucesso! Foram formatadas e processadas ${jobs.length} vagas exclusivas.`);

    } catch (error) {
        console.error('[WWR] Erro crítico no motor do WWR:', error.message);
    }
    
    return jobs;
}

module.exports = scrapeWWR;
