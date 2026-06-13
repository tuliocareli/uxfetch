const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    console.log('Iniciando Puppeteer para console check...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER PAGE ERROR:', err.message));

    const url = 'https://vagas.solides.com.br/vaga/860953/product-designer---ai-first';
    console.log('Navegando para:', url);
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('Page loaded.');
        await new Promise(r => setTimeout(r, 5000)); // Esperar 5s
        console.log('Final URL:', page.url());
    } catch (e) {
        console.error('Error:', e.message);
    }
    
    await browser.close();
})();
