const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const path = require('path');
const fs = require('fs');

const jobs = [
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
    console.log('Iniciando Puppeteer para screenshots completos de todas as vagas...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    const screenshotsDir = path.join(__dirname, 'screenshots_full');
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir);
    }

    for (const item of jobs) {
        const url = `https://vagas.solides.com.br/vaga/${item.id}/${item.slug}`;
        console.log(`Navegando para: ${url}`);
        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 4000));
            
            // Check if page content contains error message or if body length is small
            const bodyInfo = await page.evaluate(() => {
                const text = document.body.innerText;
                const hasError = text.includes('não encontrada') || text.includes('não existe') || text.includes('expirou') || text.includes('encerrada');
                return {
                    length: text.length,
                    hasError,
                    textSnippet: text.substring(0, 200).replace(/\s+/g, ' ')
                };
            });
            
            const screenshotPath = path.join(screenshotsDir, `job_${item.id}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`  Salva: ${screenshotPath} | Body Length: ${bodyInfo.length} | Has Error Text: ${bodyInfo.hasError}`);
            console.log(`  Snippet: ${bodyInfo.textSnippet}`);
        } catch (e) {
            console.error(`  Erro em ${item.id}:`, e.message);
        }
    }

    await browser.close();
}

run().catch(console.error);
