const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    console.log('Iniciando Puppeteer...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    const url = 'https://vagas.solides.com.br/vaga/862643/product-designer---joinville';
    console.log('Navegando para:', url);
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log('Final URL after load:', page.url());
        
        // Wait 3 seconds to see if a delayed redirect happens
        await new Promise(r => setTimeout(r, 3000));
        console.log('Final URL after 3s delay:', page.url());
    } catch (err) {
        console.error('Error during navigation:', err.message);
        console.log('Current URL at error:', page.url());
    }
    
    await browser.close();
})();
