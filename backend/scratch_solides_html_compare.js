const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function checkVacancy(id, slug) {
    const url = `https://vagas.solides.com.br/vaga/${id}/${slug}`;
    console.log(`\n=======================================\nChecking URL: ${url}\n=======================================`);
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000));
        
        const html = await page.evaluate(() => document.body.innerHTML);
        console.log(`Body Length: ${html.length}`);
        console.log(`Contains 'não encontrada' or similar error text:`, html.includes('não encontrada') || html.includes('não existe') || html.includes('expirou') || html.includes('processo encerrado'));
        console.log(`Snippet: ${html.substring(0, 1000).replace(/\s+/g, ' ')}`);
        
        // Let's check for specific selectors, e.g. solid-card or something
        const hasApplyButton = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            return btns.map(b => b.innerText).filter(t => t.toLowerCase().includes('candidatar') || t.toLowerCase().includes('inscri'));
        });
        console.log(`Apply buttons found:`, hasApplyButton);
    } catch (err) {
        console.error('Navigation error:', err.message);
    }
    
    await browser.close();
}

(async () => {
    await checkVacancy(862643, 'product-designer---joinville');
    await checkVacancy(860953, 'product-designer---ai-first');
})().catch(console.error);
