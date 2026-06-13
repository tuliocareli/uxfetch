const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function checkSearchInteraction() {
    const url = 'https://coodesh.com/jobs';
    console.log(`Navigating to Coodesh: ${url}`);
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 4000));
        
        console.log('Page loaded. Checking for search inputs...');
        
        // Let's find inputs again
        const inputIds = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input'))
                .map(i => ({ placeholder: i.placeholder, id: i.id }))
                .filter(i => i.placeholder && (i.placeholder.includes('Pesquisar') || i.placeholder.includes('Buscar')));
        });
        
        console.log('Search inputs found:', inputIds);
        
        if (inputIds.length > 0) {
            const searchInputSelector = `#${inputIds[0].id.replace(/_/g, '\\_')}`; // Escape underscores for CSS selector
            // Alternative: use page.type on selector
            console.log(`Typing "ux" into selector: #${inputIds[0].id}`);
            
            // Let's type "ux"
            await page.focus(`input[placeholder="${inputIds[0].placeholder}"]`);
            await page.keyboard.type('ux');
            await new Promise(r => setTimeout(r, 500));
            await page.keyboard.press('Enter');
            
            console.log('Pressed Enter. Waiting for navigation/hydration...');
            await new Promise(r => setTimeout(r, 6000));
            
            console.log('Current page URL after search:', page.url());
            
            // Get the job links now
            const links = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a'))
                    .map(a => ({ href: a.href, text: a.innerText.trim() }))
                    .filter(a => a.href.includes('/pt/jobs/'));
            });
            
            console.log(`Jobs found after search: ${links.length / 2} unique jobs (${links.length} links)`);
            links.forEach((l, i) => {
                console.log(`  [Link ${i}] text: "${l.text}" | URL: ${l.href}`);
            });
        }
        
    } catch (err) {
        console.error('Error during interaction:', err.message);
    }
    await browser.close();
}

checkSearchInteraction();
