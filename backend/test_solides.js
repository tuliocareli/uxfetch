const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('api') || url.includes('graphql') || url.includes('solides') && response.request().resourceType() === 'fetch') {
            console.log('Intercepted:', url);
        }
    });

    console.log('Navegando para Solides...');
    await page.goto('https://vagas.solides.com.br/vagas?title=ux', { waitUntil: 'networkidle2' });
    
    // Esperar um pouco para ver se os requests acontecem
    await new Promise(r => setTimeout(r, 5000));
    
    await browser.close();
})();
