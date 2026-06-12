const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    try {
        const { data } = await axios.get('https://remotar.com.br/job/139942/spread-tecnologia/tech-lead-arquiteto-.net', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const $ = cheerio.load(data);
        console.log($('body').text().substring(0, 500).replace(/\s+/g, ' '));
    } catch(e) { console.error(e.message); }
}
test();
