const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function dumpGeekHunterText() {
    const url = 'https://www.geekhunter.com.br/vagas';
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 5000));
        
        const text = await page.evaluate(() => document.body.innerText);
        console.log('--- GEEKHUNTER TEXT CONTENT ---');
        console.log(text.substring(0, 1500));
        console.log('--- END TEXT CONTENT ---');
        
    } catch(e) {
        console.error(e.message);
    }
    await browser.close();
}
dumpGeekHunterText();
