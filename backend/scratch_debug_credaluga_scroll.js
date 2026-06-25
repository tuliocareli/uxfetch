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
    
    await page.goto('https://credaluga.inhire.app/vagas', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    let previousHeight;
    for (let i = 0; i < 5; i++) {
        previousHeight = await page.evaluate('document.body.scrollHeight');
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        
        // Clicar em qualquer botão de carregar mais
        const loadMoreClicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const loadBtn = btns.find(b => b.innerText.toLowerCase().includes('mais') || b.innerText.toLowerCase().includes('carregar'));
            if (loadBtn) {
                loadBtn.click();
                return true;
            }
            return false;
        });

        await new Promise(r => setTimeout(r, 2000));
        let newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight && !loadMoreClicked) break;
    }

    const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a'))
            .filter(a => a.href.includes('/vaga'))
            .map(a => a.href);
    });

    console.log('Total de vagas após scroll:', links.length);
    console.log(links.find(l => l.includes('product-designer')) || 'Product Designer não encontrado na lista');

    await browser.close();
})();
