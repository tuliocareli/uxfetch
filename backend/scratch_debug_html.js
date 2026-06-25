const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800']
    });

    const page = await browser.newPage();
    const url = `https://credaluga.inhire.app/vagas`;
    
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 7000));
    
    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
    await new Promise(r => setTimeout(r, 3000));

    const html = await page.content();
    fs.writeFileSync('credaluga_dump.html', html);
    
    console.log("HTML dumpeado");
    
    await browser.close();
})();
