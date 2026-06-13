const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function checkCoodesh() {
    const url = 'https://coodesh.com/vagas';
    console.log(`Navigating to Coodesh: ${url}`);
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 4000));
        
        console.log('Final URL:', page.url());
        
        // Let's log the first 20 anchor tags in the DOM
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => ({ href: a.href, text: a.innerText.trim(), class: a.className }));
        });
        
        console.log(`Total links in DOM: ${links.length}`);
        links.slice(0, 30).forEach((l, i) => {
            console.log(`  [Link ${i}] text: "${l.text}" | href: "${l.href}" | class: "${l.class}"`);
        });
        
    } catch (err) {
        console.error('Error:', err.message);
    }
    await browser.close();
}

checkCoodesh();
