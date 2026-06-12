const axios = require('axios');
const cheerio = require('cheerio');

async function testNuxt() {
    try {
        const { data } = await axios.get('https://coodesh.com/vagas');
        const $ = cheerio.load(data);
        
        let found = false;
        $('script').each((i, el) => {
            const html = $(el).html() || '';
            if (html.includes('window.__NUXT__')) {
                console.log('Found NUXT!');
                console.log(html.substring(0, 300));
                found = true;
            } else if (html.includes('window.__INITIAL_STATE__')) {
                console.log('Found INITIAL STATE!');
                found = true;
            }
        });
        
        if (!found) {
            console.log("No Nuxt state found. Let's dump all script src to see if we can infer framework:");
            $('script').each((i, el) => {
                const src = $(el).attr('src');
                if (src) console.log(src);
            });
        }

        // For Geekhunter, my previous script got 404 on GET /api/v1/jobs.
        // Let's test if there's another endpoint or if the HTML has state.
        const ghHtml = await axios.get('https://www.geekhunter.com.br/vagas');
        const $gh = cheerio.load(ghHtml.data);
        $gh('script').each((i, el) => {
            const html = $gh(el).html() || '';
            if (html.includes('jobs') || html.includes('vagas')) {
                // just looking for inline data
            }
        });
        
    } catch(e) {
        console.error(e.message);
    }
}
testNuxt();
