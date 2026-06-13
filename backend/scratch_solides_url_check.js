const axios = require('axios');
const cheerio = require('cheerio');

async function debugUrl() {
    const url = 'https://vagas.solides.com.br/vaga/862643/product-designer---joinville';
    try {
        const { data, headers } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(data);
        console.log('Title tag:', $('title').text());
        console.log('Body snippet:', $('body').text().substring(0, 1000).replace(/\s+/g, ' '));
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

debugUrl().catch(console.error);
