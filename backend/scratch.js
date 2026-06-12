const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();
    await page.goto('https://remotar.com.br/', {waitUntil: 'networkidle2'});
    await page.type('input[placeholder="Insira sua busca"]', 'product design');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 4000));
    const jobs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href^="/job/"]')).slice(0, 2).map(a => a.innerText);
    });
    console.log(JSON.stringify(jobs, null, 2));
    await browser.close();
})();
