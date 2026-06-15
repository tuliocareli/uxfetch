const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();
    
    // Log API responses
    page.on('response', async res => {
        if (res.url().includes('api') || res.url().includes('vacanc') || res.url().includes('job')) {
            console.log('API:', res.url());
            try {
                const json = await res.json();
                console.log('JSON:', JSON.stringify(json).substring(0, 100));
            } catch(e) {}
        }
    });

    await page.goto('https://vagas.ilegra.com');
    await new Promise(r => setTimeout(r, 5000));
    
    const html = await page.content();
    const fs = require('fs');
    fs.writeFileSync('ilegra_dump.html', html);
    console.log('Dump saved');
    
    await browser.close();
}
run();
