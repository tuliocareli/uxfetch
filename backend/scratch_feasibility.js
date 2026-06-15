const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function checkFeasibility() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    try {
        console.log('--- CHECKING INTER (Gupy/Greenhouse?) ---');
        const page1 = await browser.newPage();
        await page1.goto('https://carreiras.inter.co/carreiras/', { waitUntil: 'networkidle2' });
        
        // Let's see what iframe or job list is there
        const interHtml = await page1.content();
        if (interHtml.includes('gupy')) console.log('Inter uses Gupy');
        if (interHtml.includes('greenhouse')) console.log('Inter uses Greenhouse');
        if (interHtml.includes('inhire')) console.log('Inter uses Inhire');
        
        const interJobs = await page1.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('vaga') || h.includes('job'));
        });
        console.log(`Found ${interJobs.length} job-like links on Inter.`);

        console.log('\n--- CHECKING INHIRE (Credipronto) ---');
        const page2 = await browser.newPage();
        await page2.goto('https://credipronto.inhire.app/vagas', { waitUntil: 'networkidle2' });
        
        const inhireHtml = await page2.content();
        const inhireJobs = await page2.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('vaga') || h.includes('/v/'));
        });
        console.log(`Found ${inhireJobs.length} job-like links on Inhire.`);
        
        // Also check if there's a JSON API being called by Inhire
        // We can't easily check network requests post-facto without a listener, but we can look for __NEXT_DATA__ or similar
        const nextData = await page2.evaluate(() => {
            const script = document.querySelector('script#__NEXT_DATA__');
            return script ? 'Has Next.js data' : 'No Next.js data';
        });
        console.log('Inhire stack:', nextData);

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

checkFeasibility();
