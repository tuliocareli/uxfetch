const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    const url = `https://credaluga.inhire.app/vagas`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));

    let previousHeight;
    for (let j = 0; j < 8; j++) {
        previousHeight = await page.evaluate('document.body.scrollHeight');
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const loadBtn = btns.find(b => b.innerText.toLowerCase().includes('mais') || b.innerText.toLowerCase().includes('carregar'));
            if (loadBtn) loadBtn.click();
        });
        await new Promise(r => setTimeout(r, 2000));
        let newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight) break;
    }

    const extractedJobs = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'))
            .filter(a => a.href.includes('/vaga') || a.href.includes('/v/'));
        
        const results = [];
        for (const a of links) {
            const href = a.href;
            let card = a.parentElement;
            while (card && card.tagName !== 'DIV' && card.parentElement) {
                card = card.parentElement;
            }
            if (card && card.innerText.length < 20 && card.parentElement) {
                card = card.parentElement;
            }
            const textContent = card ? card.innerText.trim() : a.innerText.trim();
            if (!textContent) continue;

            const lines = textContent.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length === 0) continue;

            results.push({
                title: lines[0],
                url: href
            });
        }
        return results;
    });

    console.log("=== Vagas Encontradas no Credaluga ===");
    console.log(extractedJobs.find(j => j.url.includes('product-designer')));
    
    await browser.close();
})();
