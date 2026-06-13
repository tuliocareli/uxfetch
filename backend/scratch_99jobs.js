const axios = require('axios');
const cheerio = require('cheerio');

async function test99() {
    try {
        const { data, status } = await axios.get('https://www.99jobs.com/vagas', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log('99jobs Status:', status);
        const $ = cheerio.load(data);
        console.log('Title:', $('title').text().trim());
        const links = $('a');
        console.log('Total Links:', links.length);
        const vacancyLinks = [];
        links.each((i, el) => {
            const href = $(el).attr('href') || '';
            if (href.includes('/vagas/')) {
                vacancyLinks.push({ href, text: $(el).text().trim().substring(0, 50).replace(/\s+/g, ' ') });
            }
        });
        console.log('Vacancy Links count:', vacancyLinks.length);
        vacancyLinks.slice(0, 10).forEach((l, i) => {
            console.log(`  Link ${i}: href="${l.href}" text: "${l.text}"`);
        });
    } catch(e) {
        console.error('99jobs Failed:', e.message);
    }
}
test99();
