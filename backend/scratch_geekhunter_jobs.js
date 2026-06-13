const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function getGeekHunterJobs() {
    const url = 'https://www.geekhunter.com.br/vagas';
    console.log(`Navigating to GeekHunter: ${url}`);
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 5000)); // wait for hydration
        
        // Let's grab all links pointing to "/jobs/"
        const jobs = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            return links
                .filter(a => a.href.includes('/jobs/') && !a.href.endsWith('/jobs'))
                .map(a => {
                    // Try to climb up to the parent card container to get title/company info
                    let card = a.closest('div');
                    // Look for parent divs that might contain details
                    // We can also extract the text content of the link or the card
                    let cardText = card ? card.innerText : '';
                    return {
                        href: a.href,
                        text: a.innerText.trim(),
                        cardExcerpt: cardText.substring(0, 300).replace(/\s+/g, ' ')
                    };
                });
        });
        
        console.log(`Total '/jobs/' links found in DOM: ${jobs.length}`);
        jobs.slice(0, 10).forEach((j, i) => {
            console.log(`\nJob ${i+1}:`);
            console.log(`  Link: ${j.href}`);
            console.log(`  Text: "${j.text}"`);
            console.log(`  Excerpt: "${j.cardExcerpt}"`);
        });
        
    } catch(e) {
        console.error(e.message);
    }
    await browser.close();
}
getGeekHunterJobs();
