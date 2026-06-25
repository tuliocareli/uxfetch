const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    const url = `https://estapar-trial.inhire.app/vagas`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 6000)); 

    const extractedJobs = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'))
            .filter(a => a.href.includes('/vaga/') || a.href.includes('/v/'));
        
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

            const title = lines[0];

            results.push({
                title: title,
                rawText: textContent,
                url: href
            });
        }
        return results;
    });

    console.log(JSON.stringify(extractedJobs, null, 2));
    await browser.close();
})();
