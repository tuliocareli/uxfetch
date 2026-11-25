const axios = require('axios');
const cheerio = require('cheerio');
const { isDesignRole, isLatamOrGlobal, translateWithGemini, deduplicateByUrl } = require('../utils/scraperHelpers');

const JOBS_URL = 'https://automattic.com/work-with-us/jobs/';

async function scrapeAutomattic() {
    console.log('[Automattic] Iniciando scraping via JSON embutido...');
    const jobs = [];

    try {
        const { data: html } = await axios.get(JOBS_URL, {
            timeout: 15000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });

        const $ = cheerio.load(html);
        const rawScript = $('#wwu-positions-wwu-positions-view-script-js-before').html() || '';
        const cleanedJson = rawScript
            .replace(/\/\/# sourceURL=.*$/m, '')
            .replace(/^[\s\S]*?const\s+ghJobsData\s*=\s*/, '')
            .trim()
            .replace(/;$/, '');

        if (!cleanedJson.startsWith('[')) {
            console.log('[Automattic] Bloco ghJobsData não encontrado no HTML.');
            return [];
        }

        const positions = JSON.parse(cleanedJson);

        for (const pos of positions) {
            if (pos.type !== 'job' || !pos.title || !pos.href) continue;
            if (!isDesignRole(pos.title)) continue;
            if (!isLatamOrGlobal(pos.title)) continue;

            console.log(`[Automattic] Vaga internacional aprovada: ${pos.title}. Traduzindo descrição...`);
            const description = await translateWithGemini('Automattic', pos.content, pos.title);

            jobs.push({
                title: pos.title.trim(),
                company: 'Automattic',
                location: 'Remoto',
                url: pos.href,
                source: 'Automattic',
                work_mode: 'remote',
                is_remote: true,
                is_international: true,
                description
            });
        }

        const uniqueJobs = deduplicateByUrl(jobs);
        console.log(`[Automattic] Sucesso! Foram formatadas ${uniqueJobs.length} vagas de Design.`);
        return uniqueJobs;
    } catch (error) {
        console.error('[Automattic] Erro crítico no scraper:', error.message);
        return [];
    }
}

module.exports = scrapeAutomattic;
