const axios = require('axios');
const cheerio = require('cheerio');
const { isDesignRole, stripHtml, deduplicateByUrl, delay } = require('../utils/scraperHelpers');

const BASE_URL = 'https://www.michaelpage.com.br';
const CATEGORY_PATHS = [
    '/jobs/tecnologia',
    '/jobs/marketing-e-comunica%C3%A7%C3%A3o'
];
const MAX_PAGES = 5;
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8'
};

function detectWorkMode(text) {
    const lower = (text || '').toLowerCase();
    if (/\b(remot[oa]|home\s*office|teletrabalho|100%\s*remot[oa])\b/i.test(lower)) return 'remote';
    if (/\b(h[ií]brid[oa]|hybrid)\b/i.test(lower)) return 'hybrid';
    return 'in_person';
}

async function fetchDetailInfo(url) {
    try {
        const { data: html } = await axios.get(url, { timeout: 15000, headers: HEADERS });
        const $ = cheerio.load(html);
        $('header, nav, footer, script, style, noscript').remove();
        const metaDesc = ($('meta[name="description"]').attr('content') || '').trim();
        const fullText = $('main, article, body').first().text().replace(/\s+/g, ' ').trim();
        return { metaDesc, fullText };
    } catch (error) {
        console.error(`[Michael Page] Erro ao buscar detalhes de ${url}:`, error.message);
        return null;
    }
}

async function scrapeMichaelPage() {
    console.log('[Michael Page] Iniciando scraping (Tecnologia e Marketing/Comunicação)...');
    const jobs = [];

    for (const categoryPath of CATEGORY_PATHS) {
        for (let page = 0; page < MAX_PAGES; page++) {
            const pageUrl = page === 0 ? `${BASE_URL}${categoryPath}` : `${BASE_URL}${categoryPath}?page=${page}`;
            try {
                if (page > 0) await delay(1000);
                const { data: html } = await axios.get(pageUrl, { timeout: 15000, headers: HEADERS });
                const $ = cheerio.load(html);
                const tiles = $('.job-tile');

                if (tiles.length === 0) break;

                for (const tile of tiles.toArray()) {
                    const $tile = $(tile);
                    const anchor = $tile.find('.job-title a[href*="/job-detail/"]').first();
                    const href = (anchor.attr('href') || '').split('?')[0].trim();
                    const title = anchor.text().replace(/\s+/g, ' ').trim();

                    if (!href || !title) continue;
                    if (!isDesignRole(title)) continue;

                    const rawLocation = $tile.find('.job-location').text().replace(/\s+/g, ' ').trim();
                    const cardSummary = $tile.find('.job_advert__job-summary-text').text().replace(/\s+/g, ' ').trim();
                    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;

                    const detail = await fetchDetailInfo(fullUrl);
                    const combinedText = `${title} ${rawLocation} ${cardSummary} ${detail?.fullText || ''}`;
                    const workMode = detectWorkMode(combinedText);
                    const description = stripHtml(cardSummary || detail?.metaDesc || detail?.fullText, 160)
                        || `Vaga de ${title} via Michael Page.`;

                    jobs.push({
                        title,
                        company: 'Michael Page',
                        location: workMode === 'remote' ? 'Remoto' : (rawLocation || 'Brasil'),
                        url: fullUrl,
                        source: 'Michael Page',
                        work_mode: workMode,
                        is_remote: workMode === 'remote',
                        is_international: false,
                        description
                    });
                }

                const hasNextPage = $(`a[href*="page=${page + 1}"]`).length > 0;
                if (!hasNextPage) break;
            } catch (error) {
                console.error(`[Michael Page] Erro ao acessar ${pageUrl}:`, error.message);
                break;
            }
        }
    }

    const uniqueJobs = deduplicateByUrl(jobs);
    console.log(`[Michael Page] Sucesso! Foram formatadas ${uniqueJobs.length} vagas de Design.`);
    return uniqueJobs;
}

module.exports = scrapeMichaelPage;
