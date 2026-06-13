const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const path = require('path');
const fs = require('fs');

const urls = [
    { id: '862643', slug: 'product-designer---joinville' },
    { id: '860953', slug: 'product-designer---ai-first' },
    { id: '856924', slug: 'product-designer-uiux-plsr' },
    { id: '846419', slug: 'product-designer-uxui' },
    { id: '840059', slug: 'product-designer' },
    { id: '810261', slug: 'product-designer-pleno-presencial' },
    { id: '769144', slug: 'product-designer-pleno' },
    { id: '748949', slug: 'product-design-senior' }
];

async function run() {
    console.log('Iniciando Puppeteer para multiplos screenshots...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
    }

    for (const item of urls) {
        const url = `https://vagas.solides.com.br/vaga/${item.id}/${item.slug}`;
        console.log(`Navegando para: ${url}`);
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 2000));
            const screenshotPath = path.join(screenshotsDir, `job_${item.id}.png`);
            await page.screenshot({ path: screenshotPath });
            console.log(`Salva: ${screenshotPath}`);
        } catch (e) {
            console.error(`Erro em ${item.id}:`, e.message);
        }
    }

    await browser.close();
}

run().catch(console.error);
