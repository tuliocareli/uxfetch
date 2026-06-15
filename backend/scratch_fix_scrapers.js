const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function testFixes() {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    try {
        console.log('--- TESTANDO GEEKHUNTER ---');
        const pageGH = await browser.newPage();
        await pageGH.setViewport({ width: 1280, height: 1000 });
        
        // Vamos testar se a busca via URL funciona com query ou precisamos clicar/digitar
        // A GeekHunter parece usar 'keyword=' ou uma UI de busca
        await pageGH.goto('https://www.geekhunter.com/pt/vagas?keyword=ux', { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 6000));
        
        // Pega as vagas
        const ghJobs = await pageGH.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="/jobs/"]'));
            return links.map(a => {
                const parentText = a.parentElement ? a.parentElement.innerText : a.innerText;
                const lines = parentText.split('\n').map(l => l.trim()).filter(l => l);
                return {
                    url: a.href,
                    title: lines.length > 0 ? lines[0] : 'Desconhecido',
                    lines: lines
                };
            }).filter(j => j.lines.length > 2);
        });
        
        console.log(`GeekHunter encontrou ${ghJobs.length} vagas.`);
        if (ghJobs.length > 0) {
            console.log('Exemplo GH:', ghJobs[0]);
        }

        console.log('\n--- TESTANDO COODESH ---');
        const pageC = await browser.newPage();
        await pageC.setViewport({ width: 1280, height: 1000 });
        await pageC.goto('https://coodesh.com/jobs', { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(r => setTimeout(r, 4000));
        
        // Tenta pesquisar na Coodesh
        const inputIds = await pageC.evaluate(() => {
            return Array.from(document.querySelectorAll('input'))
                .map(i => ({ placeholder: i.placeholder, id: i.id }))
                .filter(i => i.placeholder && (i.placeholder.toLowerCase().includes('pesquisar') || i.placeholder.toLowerCase().includes('buscar')));
        });
        
        if (inputIds.length > 0) {
            await pageC.focus(`input[placeholder="${inputIds[0].placeholder}"]`);
            await pageC.keyboard.type('ux');
            await new Promise(r => setTimeout(r, 500));
            await pageC.keyboard.press('Enter');
            await new Promise(r => setTimeout(r, 5000));
            
            const cJobs = await pageC.evaluate(() => {
                // Ao invés de innerText no 'a', vamos pegar a div card que contem o 'a'
                const links = Array.from(document.querySelectorAll('a[href*="/pt/jobs/"]'));
                return links.map(a => {
                    // O card geralmente é o parentElement ou dois niveis acima
                    let card = a.parentElement;
                    while (card && card.tagName !== 'DIV' && card.parentElement) {
                        card = card.parentElement;
                    }
                    // tenta subir mais um nivel se o texto for curto
                    if (card && card.innerText.length < 20 && card.parentElement) {
                        card = card.parentElement;
                    }
                    
                    const text = card ? card.innerText : '';
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                    return {
                        url: a.href,
                        title: lines.length > 0 ? lines[0] : 'Desconhecido',
                        lines: lines
                    };
                }).filter(j => j.lines.length > 0);
            });
            
            console.log(`Coodesh encontrou ${cJobs.length} vagas.`);
            if (cJobs.length > 0) {
                console.log('Exemplo Coodesh:', cJobs[0]);
            }
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
}

testFixes();
