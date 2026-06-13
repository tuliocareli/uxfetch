const axios = require('axios');
const cheerio = require('cheerio');

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
};

async function testCathoUrl(url) {
    console.log(`\nTesting Catho URL: ${url}`);
    try {
        const res = await axios.get(url, { headers, timeout: 8000, validateStatus: false });
        console.log(`  Status Code: ${res.status}`);
        const html = res.data;
        if (typeof html !== 'string') {
            console.log('  Response is not HTML string.');
            return;
        }
        console.log(`  HTML Length: ${html.length}`);
        
        const isCloudflare = html.includes('cloudflare') || html.includes('captcha') || html.includes('hCaptcha') || res.status === 403;
        console.log(`  Cloudflare/Captcha Protected: ${isCloudflare ? '❌ YES' : '✅ NO'}`);
        
        const $ = cheerio.load(html);
        const title = $('title').text().trim();
        console.log(`  Page Title: "${title}"`);
        
        // Find links or job-like elements
        const jobElements = $('[class*="job"], [class*="vaga"], a[href*="/vaga/"]');
        console.log(`  Possible job/vaga elements in HTML: ${jobElements.length}`);
        
    } catch (err) {
        console.log(`  ❌ Catho Connection Error: ${err.message}`);
    }
}

(async () => {
    await testCathoUrl('https://www.catho.com.br/vagas/ux-designer/');
    await testCathoUrl('https://www.catho.com.br/busca/vagas/?q=ux');
})().catch(console.error);
