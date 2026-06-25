const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800']
    });

    const page = await browser.newPage();
    const url = `https://credaluga.inhire.app/vagas`;
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));
    
    // Rola para baixo
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await new Promise(r => setTimeout(r, 2000));

    // Imprime botoes
    let btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText));
    console.log("Botoes 1:", btns);

    // Clica em TUDO
    await page.evaluate(() => {
        document.querySelectorAll('button').forEach(b => b.click());
    });
    
    await new Promise(r => setTimeout(r, 3000));
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await new Promise(r => setTimeout(r, 2000));

    // Imprime botoes
    btns = await page.evaluate(() => Array.from(document.querySelectorAll('button')).map(b => b.innerText));
    console.log("Botoes 2:", btns);

    // Imprime vagas
    const jobs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
            .filter(a => a.href.includes('/vaga') || a.href.includes('/v/'))
            .map(a => a.href);
    });
    
    console.log(`Encontrou ${jobs.length} vagas.`);
    if (jobs.some(j => j.includes('designer'))) {
        console.log("Designer ENCONTRADO!");
    } else {
        console.log("Designer NAO encontrado!");
    }
    
    await browser.close();
})();
