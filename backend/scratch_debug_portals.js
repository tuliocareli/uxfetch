const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function debugPortals() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    console.log('--- DEBUG GEEKHUNTER ---');
    const pageGH = await browser.newPage();
    await pageGH.setViewport({ width: 1280, height: 1000 });
    await pageGH.goto('https://www.geekhunter.com.br/vagas?q=ux', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 5000));
    
    const ghJobs = await pageGH.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('a[href*="/jobs/"]'));
        return nodes.map(n => ({
            href: n.href,
            text: n.innerText,
            lines: (n.innerText || '').split('\n').map(l => l.trim()).filter(l => l).length
        }));
    });
    console.log(`Encontrou ${ghJobs.length} links na GeekHunter.`);
    if (ghJobs.length > 0) console.log('Amostra GH:', ghJobs[0]);

    console.log('\n--- DEBUG COODESH ---');
    const pageC = await browser.newPage();
    await pageC.setViewport({ width: 1280, height: 1000 });
    await pageC.goto('https://coodesh.com/jobs', { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise(r => setTimeout(r, 4000));
    
    const inputIds = await pageC.evaluate(() => {
        return Array.from(document.querySelectorAll('input'))
            .map(i => ({ placeholder: i.placeholder, id: i.id }));
    });
    console.log('Inputs encontrados na Coodesh:', inputIds.length > 0 ? inputIds : 'Nenhum input localizado');
    
    // Tenta encontrar o de pesquisa
    const searchInput = inputIds.find(i => i.placeholder && (i.placeholder.toLowerCase().includes('pesquisar') || i.placeholder.toLowerCase().includes('buscar')));
    console.log('Input de pesquisa localizado?', !!searchInput);

    if (searchInput) {
        await pageC.focus(`input[placeholder="${searchInput.placeholder}"]`);
        await pageC.keyboard.type('ux');
        await new Promise(r => setTimeout(r, 500));
        await pageC.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 6000));
        
        const cJobs = await pageC.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .filter(a => a.href.includes('/pt/jobs/'))
                .map(a => a.innerText);
        });
        console.log(`Encontrou ${cJobs.length} vagas na Coodesh.`);
        if (cJobs.length > 0) console.log('Amostra Coodesh:', cJobs[0]);
    }

    await browser.close();
}

debugPortals().catch(console.error);
