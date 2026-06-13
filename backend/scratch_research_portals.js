const axios = require('axios');
const cheerio = require('cheerio');

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
};

async function testUrl(name, url) {
    console.log(`\nTesting [${name}] URL: ${url}`);
    try {
        const res = await axios.get(url, { headers, timeout: 8000, validateStatus: false });
        console.log(`  Status Code: ${res.status}`);
        
        const html = res.data;
        if (typeof html !== 'string') {
            console.log(`  Type: JSON or binary (length: ${JSON.stringify(html).length})`);
            return;
        }

        console.log(`  HTML Length: ${html.length}`);
        
        const isCloudflare = html.includes('cloudflare') || html.includes('captcha') || html.includes('hCaptcha') || res.status === 403;
        console.log(`  Cloudflare/Captcha Protected: ${isCloudflare ? '❌ YES' : '✅ NO'}`);
        
        const $ = cheerio.load(html);
        const title = $('title').text().trim();
        console.log(`  Page Title: "${title}"`);
        
        // Let's do some specific portal checks
        if (name === 'Coodesh') {
            const hasNextData = $('#__NEXT_DATA__').length > 0;
            console.log(`  NextJS __NEXT_DATA__ found: ${hasNextData}`);
        } else if (name === 'Hipsters Jobs') {
            const jobsCount = $('.job-list-item').length;
            console.log(`  Job items found (class job-list-item): ${jobsCount}`);
        } else if (name === 'Catho') {
            const hasCathoData = html.includes('catho') && res.status === 200;
            console.log(`  Catho responsive state: ${hasCathoData}`);
        }
    } catch (err) {
        console.log(`  ❌ Connection Error: ${err.message}`);
    }
}

(async () => {
    // 1. Coodesh
    await testUrl('Coodesh', 'https://coodesh.com/vagas?q=ux');
    
    // 2. GeekHunter
    await testUrl('GeekHunter', 'https://www.geekhunter.com.br/vagas');
    
    // 3. Hipsters Jobs
    await testUrl('Hipsters Jobs', 'https://hipsters.jobs/jobs/q/ux/');
    
    // 4. Catho
    await testUrl('Catho', 'https://www.catho.com.br/vagas/ux/');
    
    // 5. LinkedIn (Public Search)
    await testUrl('LinkedIn Public', 'https://www.linkedin.com/jobs/search/?keywords=ux%20design');

    // 6. APinfo
    await testUrl('APinfo', 'https://www.apinfo.com/apinfo/');
})().catch(console.error);
