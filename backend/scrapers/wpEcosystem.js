const axios = require('axios');
const cheerio = require('cheerio');
const { isDesignRole, isLatamOrGlobal, stripHtml, translateWithGemini, deduplicateByUrl } = require('../utils/scraperHelpers');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
};

/**
 * Extracts clean title, region hint and description from a single job detail HTML page.
 */
async function fetchDetailPage(url, fallbackTitle) {
    try {
        const { data: html } = await axios.get(url, { timeout: 15000, headers: HEADERS });
        const $ = cheerio.load(html);
        $('header, nav, footer, script, style, noscript, iframe').remove();
        const h1 = $('h1').first().text().replace(/\u200B/g, '').replace(/\s+/g, ' ').trim();
        const metaDesc = ($('meta[name="description"]').attr('content') || '').replace(/\s+/g, ' ').trim();
        const mainText = $('main, article, .entry-content, body').first().text().replace(/\u200B/g, '').replace(/\s+/g, ' ').trim();

        const locationMatch = mainText.match(/Location:\s*([^\n.]{3,140}?)(?:\s{2,}|We are|About|The Role|$)/i);
        const locationHint = locationMatch ? locationMatch[1].trim() : '';

        return {
            title: fallbackTitle || h1,
            h1,
            locationHint,
            content: metaDesc || mainText.slice(0, 3500)
        };
    } catch (error) {
        console.error(`[WP Ecosystem] Erro ao acessar ${url}:`, error.message);
        return null;
    }
}

const PORTALS = [
    {
        name: 'Fueled (10up)',
        company: 'Fueled',
        url: 'https://fueled.com/careers/',
        isInternational: true,
        extractCandidates: ($) => {
            const list = [];
            $('a[href^="https://fueled.com/careers/"]').each((_, el) => {
                const href = ($(el).attr('href') || '').trim();
                const title = $(el).text().replace(/\s+/g, ' ').trim();
                if (!href || href === 'https://fueled.com/careers/' || !title) return;
                list.push({ title, url: href, locationText: '' });
            });
            return list;
        }
    },
    {
        name: 'rtCamp',
        company: 'rtCamp',
        url: 'https://careers.rtcamp.com',
        isInternational: true,
        extractCandidates: ($) => {
            const list = [];
            $('a[href*="/job/"]').each((_, el) => {
                const href = ($(el).attr('href') || '').trim();
                const parts = $(el).find('h1,h2,h3,h4,span,p,div')
                    .map((__, c) => $(c).clone().children().remove().end().text().trim())
                    .get()
                    .filter(Boolean);
                const title = parts[0] || $(el).text().replace(/\s+/g, ' ').trim();
                const locationText = parts[1] || '';
                if (!href || !title) return;
                const fullUrl = href.startsWith('http') ? href : `https://careers.rtcamp.com${href}`;
                list.push({ title, url: fullUrl, locationText });
            });
            return list;
        }
    },
    {
        name: 'Brainstorm Force',
        company: 'Brainstorm Force',
        url: 'https://brainstormforce.com/join/',
        isInternational: true,
        needsDetailTitle: true,
        extractCandidates: ($) => {
            const seen = new Set();
            const list = [];
            $('a[href*="/join/"]').each((_, el) => {
                const href = ($(el).attr('href') || '').trim();
                if (!href || href === 'https://brainstormforce.com/join/' || href.includes('#')) return;
                if (!/\/join\/[^/]+\/?$/.test(href) || seen.has(href)) return;
                seen.add(href);
                const slugTitle = href.replace(/\/$/, '').split('/').pop().replace(/-/g, ' ');
                list.push({ title: slugTitle, url: href, locationText: 'worldwide remote' });
            });
            return list;
        }
    },
    {
        name: 'Kinsta',
        company: 'Kinsta',
        url: 'https://kinsta.com/careers/',
        isInternational: true,
        needsDetailTitle: true,
        extractCandidates: ($) => {
            const seen = new Set();
            const list = [];
            $('a[href*="/careers/"]').each((_, el) => {
                const href = ($(el).attr('href') || '').trim();
                if (!href || href === 'https://kinsta.com/careers/' || href.includes('#')) return;
                if (!/\/careers\/[^/]+\/?$/.test(href) || seen.has(href)) return;
                seen.add(href);
                const slugTitle = href.replace(/\/$/, '').split('/').pop().replace(/-/g, ' ');
                list.push({ title: slugTitle, url: href, locationText: '' });
            });
            return list;
        }
    },
    {
        name: 'Yogh',
        company: 'Yogh',
        url: 'https://www.yogh.com.br/trabalhe-conosco/',
        isInternational: false,
        needsDetailTitle: true,
        extractCandidates: ($) => {
            const seen = new Set();
            const list = [];
            $('a[href*="/trabalhe-conosco/vaga-"]').each((_, el) => {
                const href = ($(el).attr('href') || '').trim();
                if (!href || seen.has(href)) return;
                seen.add(href);
                const slugTitle = href.replace(/\/$/, '').split('/').pop().replace(/^vaga-/, '').replace(/-/g, ' ');
                list.push({ title: slugTitle, url: href, locationText: 'Brasil' });
            });
            return list;
        }
    }
];

async function scrapeWpEcosystem() {
    console.log('[WP Ecosystem] Iniciando scraping dos portais WordPress...');
    const allJobs = [];

    for (const portal of PORTALS) {
        try {
            console.log(`[WP Ecosystem] Acessando ${portal.name}...`);
            const { data: html } = await axios.get(portal.url, { timeout: 15000, headers: HEADERS });
            const $ = cheerio.load(html);
            const candidates = portal.extractCandidates($);
            let count = 0;

            for (const candidate of candidates) {
                if (!isDesignRole(candidate.title)) continue;
                if (portal.isInternational && !isLatamOrGlobal(candidate.title, candidate.locationText)) continue;

                const detail = await fetchDetailPage(candidate.url, portal.needsDetailTitle ? null : candidate.title);
                if (!detail) continue;

                const finalTitle = (detail.title || candidate.title).trim();
                if (!isDesignRole(finalTitle)) continue;

                const regionSource = [finalTitle, candidate.locationText, detail.locationHint, detail.content.slice(0, 350)].join(' ');
                if (portal.isInternational && !isLatamOrGlobal(finalTitle, candidate.locationText, detail.locationHint, detail.content.slice(0, 350))) {
                    continue;
                }

                const isHybrid = /h[ií]brid|hybrid/i.test(regionSource);
                const isRemote = /remot|work from anywhere|anywhere/i.test(regionSource) || portal.isInternational;
                const workMode = isHybrid ? 'hybrid' : (isRemote ? 'remote' : 'in_person');

                let description;
                if (portal.isInternational) {
                    console.log(`[WP Ecosystem] Vaga internacional aprovada (${portal.company}): ${finalTitle}. Traduzindo descrição...`);
                    description = await translateWithGemini(portal.company, detail.content, finalTitle);
                } else {
                    description = stripHtml(detail.content, 150) || `Vaga na ${portal.company} para ${finalTitle}.`;
                }

                allJobs.push({
                    title: finalTitle,
                    company: portal.company,
                    location: workMode === 'remote' ? 'Remoto' : (portal.isInternational ? 'Global' : 'Brasil'),
                    url: candidate.url,
                    source: portal.company,
                    work_mode: workMode,
                    is_remote: workMode === 'remote',
                    is_international: portal.isInternational,
                    description
                });
                count++;
            }

            console.log(`[WP Ecosystem] ${count} vagas de Design aprovadas para ${portal.name}.`);
        } catch (error) {
            console.error(`[WP Ecosystem] Erro ao raspar ${portal.name}:`, error.message);
        }
    }

    const uniqueJobs = deduplicateByUrl(allJobs);
    console.log(`[WP Ecosystem] Sucesso! Foram formatadas ${uniqueJobs.length} vagas totais exclusivas.`);
    return uniqueJobs;
}

module.exports = scrapeWpEcosystem;
