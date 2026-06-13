const axios = require('axios');
const cheerio = require('cheerio');

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
};

async function testGeek() {
    try {
        const { data } = await axios.get('https://www.geekhunter.com.br/vagas', { headers });
        const $ = cheerio.load(data);
        console.log('Title:', $('title').text());
        
        // Let's print out some elements to see the structure
        console.log('Script tags count:', $('script').length);
        
        // Let's look for script tags that contain "window." or "__" or JSON data
        $('script').each((i, el) => {
            const content = $(el).html() || '';
            if (content.includes('window.') || content.includes('state') || content.includes('jobs') || content.includes('vagas')) {
                console.log(`Script ${i} length: ${content.length}`);
                if (content.length > 500 && content.length < 50000) {
                    console.log(`  Snippet: ${content.substring(0, 300).replace(/\s+/g, ' ')}`);
                }
            }
        });

        // Let's print some HTML divs to check if jobs are rendered directly in HTML
        const jobElements = $('a[href*="/vaga/"], div[class*="job"], div[class*="vaga"]');
        console.log(`Possible job elements count: ${jobElements.length}`);
        jobElements.slice(0, 10).each((i, el) => {
            console.log(`  Elem ${i}: href="${$(el).attr('href')}" class="${$(el).attr('class')}" text: "${$(el).text().trim().substring(0, 100).replace(/\s+/g, ' ')}"`);
        });

    } catch (e) {
        console.error(e.message);
    }
}

testGeek();
