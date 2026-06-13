const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const path = require('path');

(async () => {
    console.log('Iniciando Puppeteer para screenshot...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    // Set a normal viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    const url = 'https://vagas.solides.com.br/vaga/862643/product-designer---joinville';
    console.log('Navegando para:', url);
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 2000)); // Esperar mais 2s
        
        const screenshotPath = path.join(__dirname, 'solides_vaga.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log('Screenshot salva em:', screenshotPath);
    } catch (err) {
        console.error('Error:', err.message);
    }
    
    await browser.close();
})();
