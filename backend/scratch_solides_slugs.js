const axios = require('axios');
const cheerio = require('cheerio');

async function testUrl(url) {
    console.log(`\nTesting URL: ${url}`);
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(res.data);
        console.log(`  HTTP Status: ${res.status}`);
        console.log(`  HTML Title: "${$('title').text()}"`);
        const bodyText = $('body').text();
        const hasError = bodyText.includes('não encontrada') || bodyText.includes('não existe') || bodyText.includes('expirou') || bodyText.includes('encerrada');
        console.log(`  Has Error Text: ${hasError}`);
        console.log(`  Text length: ${bodyText.length}`);
    } catch (err) {
        console.log(`  Error: ${err.message}`);
    }
}

(async () => {
    await testUrl('https://vagas.solides.com.br/vagas/todos/product-designer-pl?id=QXfVHgTIlM');
})().catch(console.error);
