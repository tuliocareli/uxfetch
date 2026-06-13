const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function checkSearch(queryParam) {
    const url = `https://coodesh.com/jobs?${queryParam}`;
    console.log(`\n=================================\nTesting search URL: ${url}\n=================================`);
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 4000));
        
        console.log('Loaded URL:', page.url());
        
        const text = await page.evaluate(() => document.body.innerText);
        console.log('Body Text Snippet (first 400 chars):');
        console.log(' ', text.substring(0, 400).replace(/\s+/g, ' '));
        
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => ({ href: a.href, text: a.innerText.trim() }))
                .filter(a => a.href.includes('/pt/jobs/'));
        });
        
        console.log(`Found ${links.length} jobs:`);
        links.forEach((l, i) => {
            console.log(`  - "${l.text}" | URL: ${l.href}`);
        });
        
    } catch (err) {
        console.error('Error:', err.message);
    }
    await browser.close();
}

(async () => {
    // Let's test different search parameters:
    await checkSearch('search=ux');
    await checkSearch('q=ux');
})().catch(console.error);
