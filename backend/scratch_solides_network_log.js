const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function checkVacancy(id, slug) {
    const url = `https://vagas.solides.com.br/vaga/${id}/${slug}`;
    console.log(`\n=======================================\nChecking URL: ${url}\n=======================================`);
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Log response status and headers of all requests
    page.on('response', async (response) => {
        const reqUrl = response.url();
        const request = response.request();
        const resourceType = request.resourceType();
        const status = response.status();
        
        if (status >= 400 || reqUrl.includes('solides')) {
            console.log(`[RESPONSE] ${resourceType} | ${status} | ${reqUrl}`);
            if (status >= 400) {
                try {
                    const text = await response.text();
                    console.log(`  Error Body (first 200 chars): ${text.substring(0, 200)}`);
                } catch (e) {
                    console.log(`  Error Body could not be read: ${e.message}`);
                }
            }
        }
    });

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));
        console.log(`Final Page URL: ${page.url()}`);
    } catch (err) {
        console.error('Navigation error:', err.message);
    }
    
    await browser.close();
}

(async () => {
    // 862643 is supposed to be active, 860953 is blank/inactive
    await checkVacancy(862643, 'product-designer---joinville');
    await checkVacancy(860953, 'product-designer---ai-first');
})().catch(console.error);
