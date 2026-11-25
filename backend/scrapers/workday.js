const axios = require('axios');
const { isDesignRole, isLatamOrGlobal, translateWithGemini, deduplicateByUrl } = require('../utils/scraperHelpers');

const COMPANIES = [
    { tenant: 'wpengine', instance: 'wd1', site: 'WP_Engine', name: 'WP Engine' }
];

const HEADERS = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
};

async function fetchWorkdayDetail(baseUrl, company, externalPath, title) {
    try {
        const { data } = await axios.get(`${baseUrl}/wday/cxs/${company.tenant}/${company.site}${externalPath}`, {
            timeout: 15000,
            headers: HEADERS
        });
        const info = data?.jobPostingInfo;
        const loc = info?.location || '';
        const rawHtml = info?.jobDescription || '';
        return { location: loc, rawHtml };
    } catch (error) {
        console.error(`[Workday] Erro ao buscar detalhes de ${title}:`, error.message);
        return { location: '', rawHtml: '' };
    }
}

async function scrapeWorkday() {
    console.log('[Workday] Iniciando scraping multi-empresas via CXS API...');
    const allJobs = [];

    for (const company of COMPANIES) {
        const baseUrl = `https://${company.tenant}.${company.instance}.myworkdayjobs.com`;
        try {
            console.log(`[Workday] Buscando vagas para ${company.name}...`);
            const postings = [];
            const pageSize = 20;
            let offset = 0;

            while (true) {
                const { data } = await axios.post(
                    `${baseUrl}/wday/cxs/${company.tenant}/${company.site}/jobs`,
                    { appliedFacets: {}, limit: pageSize, offset, searchText: '' },
                    { timeout: 15000, headers: HEADERS }
                );

                const batch = data?.jobPostings || [];
                postings.push(...batch);
                const total = data?.total || 0;
                offset += pageSize;
                if (batch.length < pageSize || offset >= total) break;
            }

            let count = 0;

            for (const job of postings) {
                const title = (job.title || '').trim();
                const locSummary = (job.locationsText || '').trim();
                if (!isDesignRole(title)) continue;
                if (!isLatamOrGlobal(title, locSummary)) continue;

                const detail = await fetchWorkdayDetail(baseUrl, company, job.externalPath, title);
                const fullLoc = [locSummary, detail.location].filter(Boolean).join(' ');
                if (!isLatamOrGlobal(title, fullLoc)) continue;

                const isRemote = /remote|wfh|remot/i.test(`${title} ${fullLoc}`);
                const isHybrid = /hybrid|híbrid/i.test(`${title} ${fullLoc}`);
                const workMode = isRemote ? 'remote' : (isHybrid ? 'hybrid' : 'in_person');

                console.log(`[Workday] Vaga internacional aprovada (${company.name}): ${title}. Traduzindo descrição...`);
                const description = await translateWithGemini('Workday', detail.rawHtml, title);

                allJobs.push({
                    title,
                    company: company.name,
                    location: isRemote ? 'Remoto' : (detail.location || locSummary || 'Global'),
                    url: `${baseUrl}/en-US/${company.site}${job.externalPath}`,
                    source: 'Workday',
                    work_mode: workMode,
                    is_remote: isRemote,
                    is_international: true,
                    description
                });
                count++;
            }

            console.log(`[Workday] ${count} vagas de Design aprovadas para ${company.name}.`);
        } catch (error) {
            console.error(`[Workday] Erro ao buscar ${company.name}:`, error.message);
        }
    }

    const uniqueJobs = deduplicateByUrl(allJobs);
    console.log(`[Workday] Sucesso! Foram formatadas ${uniqueJobs.length} vagas totais exclusivas.`);
    return uniqueJobs;
}

module.exports = scrapeWorkday;
