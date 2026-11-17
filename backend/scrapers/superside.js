const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const delay = ms => new Promise(res => setTimeout(res, ms));

const BASE_URL = 'https://careers.superside.com';
const JOBS_URL = `${BASE_URL}/jobs/`;

const INCLUDE_REGEX = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|diretor\s+de\s+arte|art\s+director|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|motion\s+graphics|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|designer\b|videomaker|editor(a)?\s+de\s+v[ií]deo|audiovisual|edi[çc][ãa]o\s+de\s+v[ií]deo)/i;

const EXCLUDE_KEYWORDS = [
    'desenvolvedor', 'developer', 'arquiteto', 'architect',
    'tech lead', 'programador', 'engenheiro de software', 'software engineer',
    'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
    'moda', 'interiores', 'produto físico', 'embalagem', 'performance',
    'sobrancelha', 'sobrancelhas', 'unha', 'unhas', 'cílios', 'cilios', 'micropigmentação',
    'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'
];

/**
 * Translates an English job description into a concise PT-BR card summary via Gemini.
 */
async function translateWithGemini(rawText) {
    if (!genAI) {
        console.warn('[Superside] Aviso: GEMINI_API_KEY não configurada. Pulando tradução.');
        return null;
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Crie um resumo curto e atrativo desta vaga de Design em Português do Brasil.
IMPORTANTE:
- Escreva no MÁXIMO 2 ou 3 frases curtas (cerca de 120 caracteres, ideal para um card pequeno).
- Retorne APENAS TEXTO PURO. É estritamente proibido retornar tags HTML, imagens, links ou markdown.
- Termine o texto com "..." (reticências).
- Não traduza jargões técnicos da área de design e tecnologia (ex: wireframe, mockup, hand-off, UI kit, motion).

Texto da vaga original:
${rawText}`;

        const result = await model.generateContent(prompt);
        return result.response.text().replace(/\n+/g, ' ').trim();
    } catch (error) {
        console.error('[Superside] Erro ao traduzir com Gemini:', error.message);
        return null;
    }
}

/**
 * Fetches a job detail page and returns a clean summary (translated to PT-BR when possible).
 */
async function fetchJobDescription(jobUrl, title) {
    const fallback = `Vaga internacional na Superside para ${title}.`;
    try {
        const { data: jobHtml } = await axios.get(jobUrl, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const $ = cheerio.load(jobHtml);
        const metaDesc = ($('meta[name="description"]').attr('content') || '').replace(/\s+/g, ' ').trim();
        const rawText = metaDesc || $('main').text().replace(/\s+/g, ' ').trim().slice(0, 600);

        if (!rawText) return fallback;

        console.log(`[Superside] Vaga internacional encontrada: ${title}. Iniciando tradução com Gemini...`);
        const translated = await translateWithGemini(rawText);
        if (translated) {
            await delay(4000);
            return translated;
        }

        return rawText.length > 150 ? `${rawText.substring(0, 150).trim()}...` : rawText;
    } catch (error) {
        console.error(`[Superside] Erro ao buscar descrição de ${jobUrl}:`, error.message);
        return fallback;
    }
}

function parseWorkMode(metadataText) {
    const lower = (metadataText || '').toLowerCase();
    if (lower.includes('remote') || lower.includes('remot')) return 'remote';
    if (lower.includes('hybrid') || lower.includes('híbrid')) return 'hybrid';
    return 'in_person';
}

async function scrapeSuperside() {
    console.log('[Superside] Iniciando scraping de https://careers.superside.com/jobs/...');
    const jobs = [];

    try {
        const { data: html } = await axios.get(JOBS_URL, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const $ = cheerio.load(html);
        const candidates = [];

        $('a[href*="/jobs/"]').each((_, el) => {
            const href = ($(el).attr('href') || '').trim();
            if (!href || href === '/jobs/' || href === JOBS_URL) return;

            const card = $(el).parent().parent();
            const title = (card.find('[data-testid="document-title"], h3').first().text() || '').replace(/\s+/g, ' ').trim();
            const metadata = (card.find('[data-testid="document-metadata"]').first().text() || '').replace(/\s+/g, ' ').trim();

            if (!title) return;

            const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
            candidates.push({ title, metadata, url: fullUrl });
        });

        for (const candidate of candidates) {
            const titleLower = candidate.title.toLowerCase();
            const isDesign = INCLUDE_REGEX.test(titleLower);
            const isExcluded = EXCLUDE_KEYWORDS.some(k => titleLower.includes(k));

            if (!isDesign || isExcluded) continue;

            const workMode = parseWorkMode(candidate.metadata);
            const description = await fetchJobDescription(candidate.url, candidate.title);

            jobs.push({
                title: candidate.title,
                company: 'Superside',
                location: workMode === 'remote' ? 'Remoto' : 'Global',
                url: candidate.url,
                source: 'Superside',
                work_mode: workMode,
                is_remote: workMode === 'remote',
                is_international: true,
                description
            });
        }

        const uniqueJobs = [];
        for (const job of jobs) {
            if (!uniqueJobs.some(j => j.url === job.url)) {
                uniqueJobs.push(job);
            }
        }

        console.log(`[Superside] Sucesso! Foram formatadas ${uniqueJobs.length} vagas de Design.`);
        return uniqueJobs;
    } catch (error) {
        console.error('[Superside] Erro crítico no scraper:', error.message);
        return [];
    }
}

module.exports = scrapeSuperside;
