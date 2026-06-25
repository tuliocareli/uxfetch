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
    await new Promise(r => setTimeout(r, 7000)); // Esperar 7s igual ao inhire.js
    
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

    const debugJob = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'))
            .filter(a => a.href.includes('/vaga') || a.href.includes('/v/'));
        
        for (const a of links) {
            if (a.href.includes('product-designer')) {
                let card = a.parentElement;
                while (card && card.tagName !== 'DIV' && card.parentElement) {
                    card = card.parentElement;
                }
                if (card && card.innerText.length < 20 && card.parentElement) {
                    card = card.parentElement;
                }
                
                const textContent = card ? card.innerText.trim() : a.innerText.trim();
                const lines = textContent.split('\n').map(l => l.trim()).filter(l => l);
                return lines;
            }
        }
        return null;
    });

    console.log("=== Linhas da Vaga Product Designer ===");
    console.log(debugJob);
    
    await browser.close();
})();
