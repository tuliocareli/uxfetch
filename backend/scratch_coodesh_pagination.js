const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function checkPagination() {
    const url = 'https://coodesh.com/jobs';
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 4000));
        
        // Find buttons that might load more or be page numbers
        const buttons = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('button'))
                .map(b => ({ text: b.innerText.trim(), class: b.className }));
        });
        
        console.log('Buttons in DOM:', buttons);
        
        // Let's also check if there is an input field for searching or if there are select tags for filters
        const filters = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input')).map(i => ({ placeholder: i.placeholder, name: i.name, id: i.id }));
            const selects = Array.from(document.querySelectorAll('select')).map(s => ({ name: s.name, id: s.id, options: Array.from(s.options).map(o => o.text) }));
            return { inputs, selects };
        });
        console.log('Inputs found:', filters.inputs);
        console.log('Selects found:', filters.selects);
        
    } catch (err) {
        console.error('Error:', err.message);
    }
    await browser.close();
}

checkPagination();
