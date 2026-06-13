const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function checkGeekHunterPagination() {
    const url = 'https://www.geekhunter.com.br/vagas';
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 5000)); // wait for hydration
        
        // Find all buttons or links that look like pagination
        const paginationElements = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('button, a'));
            return elements
                .filter(el => {
                    const text = el.innerText.trim();
                    const isPageNum = /^\d+$/.test(text);
                    const isNextPrev = text.toLowerCase().includes('próxim') || text.toLowerCase().includes('anterior') || text.toLowerCase().includes('carregar');
                    const hasPaginationClass = el.className && (el.className.includes('pagination') || el.className.includes('page'));
                    return isPageNum || isNextPrev || hasPaginationClass;
                })
                .map(el => ({
                    tagName: el.tagName,
                    text: el.innerText.trim(),
                    className: el.className,
                    href: el.tagName === 'A' ? el.href : null
                }));
        });
        
        console.log('Pagination elements found:', paginationElements);
        
        // Let's also check if there is a query param change like ?page=2
        // We can check if there are links containing "?page="
        const pageLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .filter(a => a.href.includes('page=') || a.href.includes('p='))
                .map(a => ({ href: a.href, text: a.innerText.trim() }));
        });
        console.log('Links with page params found:', pageLinks);
        
    } catch(e) {
        console.error(e.message);
    }
    await browser.close();
}
checkGeekHunterPagination();
