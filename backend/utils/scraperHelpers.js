const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
let geminiQuotaExhausted = false;

const INCLUDE_REGEX = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|diretor\s+de\s+arte|art\s+director|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|motion\s+graphics|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|content\s+design(er)?|designer\b|videomaker|editor(a)?\s+de\s+v[ií]deo|video\s+educator|audiovisual|edi[çc][ãa]o\s+de\s+v[ií]deo)/i;

const EXCLUDE_KEYWORDS = [
    'desenvolvedor', 'developer', 'arquiteto', 'architect',
    'tech lead', 'programador', 'engenheiro de software', 'software engineer',
    'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
    'moda', 'interiores', 'produto físico', 'embalagem', 'performance',
    'sobrancelha', 'sobrancelhas', 'unha', 'unhas', 'cílios', 'cilios', 'micropigmentação',
    'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'
];

const POSITIVE_REGION_REGEX = /\b(latam|latin\s+america|south\s+america|central\s+(?:or|and)\s+south\s+america|americas|am[eé]rica\s+latina|brasil|brazil|global|worldwide|anywhere|work\s+from\s+anywhere)\b/i;
const RESTRICTED_REGION_REGEX = /\b(emea|apac|asia[\s-]pacific|europe\s+only|eu\s+only|uk\s+only|us\s+only|usa\s+only|united\s+states\s+only|north\s+america\s+only|canada\s+only|united\s+states|united\s+kingdom|india|singapore|australia|poland|krakow|germany|ireland|limerick|austin|sydney)\b/i;

const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Validates whether a job title matches UX/UI/Product/Visual/Motion Design roles.
 */
function isDesignRole(title, extraExcludes = []) {
    if (!title) return false;
    const t = title.toLowerCase();
    const excludes = extraExcludes.length ? [...EXCLUDE_KEYWORDS, ...extraExcludes] : EXCLUDE_KEYWORDS;
    return INCLUDE_REGEX.test(t) && !excludes.some(k => t.includes(k));
}

/**
 * Ensures international jobs accept LATAM/Global applicants and rejects EMEA/APAC/country-locked roles.
 */
function isLatamOrGlobal(...texts) {
    const combined = texts.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    if (!combined) return true;

    const lower = combined.toLowerCase();
    // Explicit EMEA or APAC regional locks in job title or location label are always rejected
    if (/\b(emea|apac|asia[\s-]pacific)\b/i.test(lower) && !/\b(latam|latin\s+america|south\s+america|global|worldwide|anywhere)\b/i.test(lower)) {
        return false;
    }

    if (POSITIVE_REGION_REGEX.test(lower)) {
        return true;
    }

    return !RESTRICTED_REGION_REGEX.test(lower);
}

/**
 * Strips HTML tags and truncates text cleanly for job cards.
 */
function stripHtml(html, maxLen = 150) {
    if (!html) return '';
    const decoded = String(html).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
    const plain = decoded.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
    if (!plain) return '';
    return plain.length > maxLen ? `${plain.substring(0, maxLen).trim()}...` : plain;
}

/**
 * Translates an international job description into a concise PT-BR card summary via Gemini.
 */
async function translateWithGemini(sourceLabel, rawContent, fallbackTitle = '') {
    const plainFallback = stripHtml(rawContent, 150) || `Vaga internacional encontrada pelo UX Fetch${fallbackTitle ? `: ${fallbackTitle}` : ''}.`;
    if (!genAI || !rawContent || geminiQuotaExhausted) {
        if (!genAI) console.warn(`[${sourceLabel}] Aviso: GEMINI_API_KEY não configurada. Pulando tradução.`);
        return plainFallback;
    }

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `Crie um resumo curto e atrativo desta vaga de Design em Português do Brasil.
IMPORTANTE:
- Escreva no MÁXIMO 2 ou 3 frases curtas (cerca de 120 caracteres, ideal para um card pequeno).
- Retorne APENAS TEXTO PURO. É estritamente proibido retornar tags HTML, imagens, links ou markdown.
- Termine o texto com "..." (reticências).
- Não traduza jargões técnicos da área de design e tecnologia (ex: wireframe, mockup, hand-off, UI kit, WordPress).

Conteúdo da vaga original:
${String(rawContent).slice(0, 4000)}`;

        const result = await model.generateContent(prompt);
        const translated = result.response.text().replace(/\n+/g, ' ').trim();
        await delay(4000);
        return translated || plainFallback;
    } catch (error) {
        if (String(error.message).includes('429') || String(error.message).toLowerCase().includes('quota')) {
            geminiQuotaExhausted = true;
            console.warn(`[${sourceLabel}] Cota diária do Gemini atingida; usando fallback de texto limpo.`);
        } else {
            console.error(`[${sourceLabel}] Erro ao traduzir com Gemini:`, error.message);
        }
        return plainFallback;
    }
}

function deduplicateByUrl(jobs) {
    const seen = new Set();
    return jobs.filter(job => {
        if (!job.url || seen.has(job.url)) return false;
        seen.add(job.url);
        return true;
    });
}

module.exports = {
    delay,
    isDesignRole,
    isLatamOrGlobal,
    stripHtml,
    translateWithGemini,
    deduplicateByUrl
};
