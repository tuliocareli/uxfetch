const axios = require('axios');
const cheerio = require('cheerio');

async function parseSitemaps() {
    try {
        const ghSitemap = await axios.get('https://www.geekhunter.com.br/sitemap.xml');
        const $gh = cheerio.load(ghSitemap.data, { xmlMode: true });
        console.log('Geekhunter Sitemap URLs containing "vaga":');
        $gh('loc').each((i, el) => {
            const url = $gh(el).text();
            if (url.includes('vaga')) console.log(url);
        });

        const coodeshSitemap = await axios.get('https://coodesh.com/sitemap.xml');
        const $co = cheerio.load(coodeshSitemap.data, { xmlMode: true });
        console.log('\nCoodesh Sitemap URLs containing "vagas":');
        $co('loc').each((i, el) => {
            const url = $co(el).text();
            if (url.includes('vagas')) console.log(url);
        });
    } catch(e) {
        console.error(e.message);
    }
}
parseSitemaps();
