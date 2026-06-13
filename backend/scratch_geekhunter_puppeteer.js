const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function checkGeekHunter() {
    const url = 'https://www.geekhunter.com.br/vagas';
    console.log(`Navigating to GeekHunter: ${url}`);
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 5000)); // wait for hydration
        
        console.log('Final URL:', page.url());
        
        // Let's get page title
        const title = await page.title();
        console.log('Page Title:', title);
        
        // Find links and print their text to find where jobs are
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .map(a => ({ href: a.href, text: a.innerText.trim(), className: a.className }));
        });
        
        console.log(`Total links in DOM: ${links.length}`);
        
        // Filter links containing "vaga" or similar
        const jobLinks = links.filter(l => l.href.includes('/vaga/') || l.href.includes('/vagas/'));
        console.log(`Job links count: ${jobLinks.length}`);
        jobLinks.slice(0, 15).forEach((l, i) => {
            console.log(`  [Link ${i}] text: "${l.text.replace(/\s+/g, ' ')}" | href: "${l.href}"`);
        });
        
        // Let's print out text from elements that look like cards
        const divs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('div'))
                .map(d => ({ className: d.className, text: d.innerText.trim() }))
                .filter(d => d.className && (d.className.includes('Job') || d.className.includes('card')));
        });
        console.log(`Divs with Job/card in class: ${divs.length}`);
        divs.slice(0, 5).forEach((d, i) => {
            console.log(`  [Div ${i}] class: "${d.className}" | text: "${d.text.substring(0, 150).replace(/\s+/g, ' ')}"`);
        });
        
    } catch (err) {
        console.error('Error:', err.message);
    }
    await browser.close();
}

checkGeekHunter();
