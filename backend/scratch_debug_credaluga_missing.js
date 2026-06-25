const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });

    // Tirar screenshot da página principal de vagas
    console.log('Acessando página principal...');
    await page.goto('https://credaluga.inhire.app/vagas', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'credaluga_main.png', fullPage: true });

    // Tirar screenshot da página da vaga específica
    console.log('Acessando vaga específica...');
    await page.goto('https://credaluga.inhire.app/vagas/cf46cda0-78ff-4bf8-9a01-6234c14817ff/product-designer-pleno?source=linkedin', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'credaluga_job.png', fullPage: true });
    
    // Pegar o título e conteúdo do status da vaga
    const pageText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('--- Texto da Vaga ---');
    console.log(pageText);

    await browser.close();
})();
