const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

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
    console.log('Iniciando console check para todas as vagas...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    for (const job of jobs) {
        const url = `https://vagas.solides.com.br/vaga/${job.id}/${job.slug}`;
        console.log(`\nChecking: ${url}`);
        
        const errors = [];
        const consoles = [];
        
        const onErr = err => errors.push(err.message);
        const onConsole = msg => {
            const text = msg.text();
            if (text.includes('status of 40') || text.includes('status of 50') || text.includes('error') || text.includes('failed')) {
                consoles.push(text);
            }
        };

        page.on('pageerror', onErr);
        page.on('console', onConsole);

        try {
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
            await new Promise(r => setTimeout(r, 2000));
            console.log(`  Errors:`, errors);
            console.log(`  Bad Consoles:`, consoles);
        } catch (e) {
            console.error(`  Nav error:`, e.message);
        }

        page.off('pageerror', onErr);
        page.off('console', onConsole);
    }

    await browser.close();
}

run().catch(console.error);
