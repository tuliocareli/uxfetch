const axios = require('axios');
const { isDesignRole, isLatamOrGlobal, translateWithGemini, deduplicateByUrl } = require('../utils/scraperHelpers');

const COMPANIES = [
    { id: 'humanmade', name: 'Human Made' },
    { id: 'awesomemotive', name: 'Awesome Motive' }
];

const HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

function formatLocationsText(job) {
    if (Array.isArray(job.locations) && job.locations.length > 0) {
        return job.locations.map(l => [l.city, l.region, l.country].filter(Boolean).join(', ')).join(' | ');
    }
    if (job.location) {
        return [job.location.city, job.location.region, job.location.country].filter(Boolean).join(', ');
    }
    return '';
}

async function fetchWorkableDescription(companyId, shortcode, title) {
    try {
        const { data } = await axios.get(`https://apply.workable.com/api/v2/accounts/${companyId}/jobs/${shortcode}`, {
            timeout: 15000,
            headers: HEADERS
        });
        const rawHtml = [data.description, data.requirements].filter(Boolean).join(' ');
        return await translateWithGemini('Workable', rawHtml, title);
    } catch (error) {
        console.error(`[Workable] Erro ao buscar detalhes de ${shortcode}:`, error.message);
        return `Vaga internacional na plataforma Workable: ${title}.`;
    }
}

async function scrapeWorkable() {
    console.log('[Workable] Iniciando scraping multi-empresas...');
    const allJobs = [];

    for (const company of COMPANIES) {
        try {
            console.log(`[Workable] Buscando vagas para ${company.name}...`);
            const { data } = await axios.post(
                `https://apply.workable.com/api/v3/accounts/${company.id}/jobs`,
                { query: '', location: [], department: [], worktype: [], remote: [] },
                { timeout: 15000, headers: HEADERS }
            );

            const results = data?.results || [];
            let count = 0;

            for (const job of results) {
                const title = (job.title || '').trim();
                if (!isDesignRole(title)) continue;

                const locText = formatLocationsText(job);
                const isRemote = job.remote === true || job.workplace === 'remote';
                const workMode = isRemote ? 'remote' : (job.workplace === 'hybrid' ? 'hybrid' : 'in_person');

                if (!isLatamOrGlobal(title, locText, isRemote ? 'remote' : '')) continue;

                console.log(`[Workable] Vaga internacional aprovada (${company.name}): ${title}. Traduzindo descrição...`);
                const description = await fetchWorkableDescription(company.id, job.shortcode, title);

                allJobs.push({
                    title,
                    company: company.name,
                    location: isRemote ? 'Remoto' : (locText || 'Global'),
                    url: `https://apply.workable.com/${company.id}/j/${job.shortcode}/`,
                    source: 'Workable',
                    work_mode: workMode,
                    is_remote: isRemote,
                    is_international: true,
                    description
                });
                count++;
            }

            console.log(`[Workable] ${count} vagas de Design aprovadas para ${company.name}.`);
        } catch (error) {
            console.error(`[Workable] Erro ao buscar ${company.name}:`, error.message);
        }
    }

    const uniqueJobs = deduplicateByUrl(allJobs);
    console.log(`[Workable] Sucesso! Foram formatadas ${uniqueJobs.length} vagas totais exclusivas.`);
    return uniqueJobs;
}

module.exports = scrapeWorkable;
