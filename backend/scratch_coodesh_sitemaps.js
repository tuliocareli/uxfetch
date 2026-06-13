const axios = require('axios');
const cheerio = require('cheerio');

async function inspectCoodeshSitemaps() {
    try {
        console.log('Fetching Coodesh Sitemap Index...');
        const res = await axios.get('https://coodesh.com/sitemap.xml');
        console.log('Status:', res.status);
        console.log('Sitemap root snippet (first 1000 chars):');
        console.log(res.data.substring(0, 1000));
        
        const $ = cheerio.load(res.data, { xmlMode: true });
        const sitemaps = [];
        $('sitemap loc, url loc').each((i, el) => {
            sitemaps.push($(el).text());
        });
        
        console.log(`Total URLs found in sitemap: ${sitemaps.length}`);
        console.log('First 20 URLs:');
        sitemaps.slice(0, 20).forEach((url, i) => {
            console.log(`  [${i}] ${url}`);
        });
        
        // Let's filter urls containing "jobs" or "vagas"
        const jobSitemaps = sitemaps.filter(url => url.includes('job') || url.includes('vaga') || url.includes('sitemap-'));
        console.log('\nRelevant sitemaps/URLs found:');
        jobSitemaps.forEach(url => console.log('  ', url));
        
    } catch(e) {
        console.error('Failed to fetch Coodesh sitemaps:', e.message);
    }
}
inspectCoodeshSitemaps();
