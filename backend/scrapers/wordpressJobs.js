const axios = require('axios');
const cheerio = require('cheerio');
const { isDesignRole, isLatamOrGlobal, stripHtml, translateWithGemini, deduplicateByUrl } = require('../utils/scraperHelpers');

const JOBS_URL = 'https://jobs.wordpress.net/';
const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function fetchJobDescription(url, title) {
    try {
        const { data: html } = await axios.get(url, { timeout: 15000, headers: HEADERS });
        const $ = cheerio.load(html);
        $('header, nav, footer, script, style, noscript, iframe').remove();
        const content = $('main, article, .job-description, body').first().text().replace(/\s+/g, ' ').trim();
        return await translateWithGemini('WordPress Jobs', content.slice(0, 3500), title);
    } catch (error) {
        console.error(`[WordPress Jobs] Erro ao buscar detalhes de ${url}:`, error.message);
        return `Vaga internacional de WordPress & Design: ${title}.`;
    }
}

async function scrapeWordpressJobs() {
    console.log('[WordPress Jobs] Iniciando scraping de https://jobs.wordpress.net/...');
    const jobs = [];

    try {
        const { data: html } = await axios.get(JOBS_URL, { timeout: 15000, headers: HEADERS });
        const $ = cheerio.load(html);

        const candidates = [];
        $('a[href*="/job/"]').each((_, el) => {
            const href = ($(el).attr('href') || '').trim();
            if (!href) return;

            const parts = $(el).find('*')
                .map((__, c) => $(c).clone().children().remove().end().text().trim())
                .get()
                .filter(Boolean);

            const title = parts[1] || $(el).text().replace(/\s+/g, ' ').trim();
            const company = parts[2] || 'Comunidade WordPress';
            const locationText = parts[3] || '';
            const workType = parts[4] || '';

            candidates.push({ title, company, locationText, workType, url: href });
        });

        for (const candidate of candidates) {
            if (!isDesignRole(candidate.title, ['freelance', 'part time', 'part-time'])) continue;
            if (/part[\s-]?time|freelance/i.test(candidate.workType)) continue;

            const isRemote = /remote|remot/i.test(`${candidate.locationText} ${candidate.title}`);
            if (!isRemote) continue;
            if (!isLatamOrGlobal(candidate.title, candidate.locationText)) continue;

            console.log(`[WordPress Jobs] Vaga aprovada: ${candidate.title} (${candidate.company}). Traduzindo...`);
            const description = await fetchJobDescription(candidate.url, candidate.title);

            jobs.push({
                title: candidate.title,
                company: candidate.company,
                location: 'Remoto',
                url: candidate.url,
                source: 'WordPress Jobs',
                work_mode: 'remote',
                is_remote: true,
                is_international: true,
                description: stripHtml(description, 180) || description
            });
        }

        const uniqueJobs = deduplicateByUrl(jobs);
        console.log(`[WordPress Jobs] Sucesso! Foram formatadas ${uniqueJobs.length} vagas de Design.`);
        return uniqueJobs;
    } catch (error) {
        console.error('[WordPress Jobs] Erro crítico no scraper:', error.message);
        return [];
    }
}

module.exports = scrapeWordpressJobs;
