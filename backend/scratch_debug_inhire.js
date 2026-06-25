const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const debugCompany = async (id, name) => {
        const page = await browser.newPage();
        try {
            const url = `https://${id}.inhire.app/vagas`;
            console.log(`Testando ${url}...`);
            await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
            await new Promise(r => setTimeout(r, 6000)); // Esperar mais tempo pra garantir

            const html = await page.content();
            console.log(`HTML length para ${name}:`, html.length);
            
            const links = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('a')).map(a => ({
                    href: a.href,
                    text: a.innerText.trim()
                }));
            });
            console.log(`Links encontrados na ${name}:`, links.length);
            console.log(links.slice(0, 15)); // mostrar os primeiros 15
        } catch (e) {
            console.error(`Erro na ${name}:`, e.message);
        } finally {
            await page.close();
        }
    };

    await debugCompany('credaluga', 'Credaluga');
    await debugCompany('estapar-trial', 'Estapar');

    await browser.close();
})();
