const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeCoodesh() {
    let browser;
    let jobs = [];
    try {
        console.log('Iniciando scraper Coodesh...');
        browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1000 });
        
        const url = 'https://coodesh.com/jobs';
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|designer\b)/i;
        const excludeKeywords = [
            'desenvolvedor', 'developer', 'arquiteto', 'architect', 
            'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
            'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
                    'moda', 'interiores', 'produto físico', 'embalagem',   'performance',
            'sobrancelha', 'sobrancelhas', 'unha', 'unhas', 'cílios', 'cilios', 'micropigmentação'
        , 'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'
        ];
        
        
        // Esperar a página carregar
        await new Promise(r => setTimeout(r, 4000));
        
        // Tentar buscar por "ux"
        const inputIds = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input'))
                .map(i => ({ placeholder: i.placeholder, id: i.id }))
                .filter(i => i.placeholder && (i.placeholder.toLowerCase().includes('pesquisar') || i.placeholder.toLowerCase().includes('buscar')));
        });

        if (inputIds.length > 0) {
            // Foca e digita "ux"
            await page.focus(`input[placeholder="${inputIds[0].placeholder}"]`);
            await page.keyboard.type('ux');
            await new Promise(r => setTimeout(r, 500));
            await page.keyboard.press('Enter');
            
            // Aguarda a hidratação/busca
            await new Promise(r => setTimeout(r, 6000));
            
            // Extrai as vagas
            const extractedJobs = await page.evaluate(() => {
                const links = Array.from(document.querySelectorAll('a'))
                    .filter(a => a.href.includes('/pt/jobs/'));
                
                const results = [];
                for (const a of links) {
                    const url = a.href;
                    
                    let card = a.parentElement;
                    while (card && card.tagName !== 'DIV' && card.parentElement) {
                        card = card.parentElement;
                    }
                    if (card && card.innerText.length < 20 && card.parentElement) {
                        card = card.parentElement;
                    }
                    
                    const text = card ? card.innerText.trim() : a.innerText.trim();
                    if (!text) continue;
                    
                    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
                    if (lines.length === 0) continue;
                    
                    const title = lines[0]; // Normalmente o primeiro texto é o cargo
                    
                    let work_mode = 'in_person';
                    const textLower = text.toLowerCase();
                    if (textLower.includes('remoto')) {
                        work_mode = 'remote';
                    } else if (textLower.includes('híbrido') || textLower.includes('hibrido')) {
                        work_mode = 'hybrid';
                    }

                    // Localização padrão
                    let location = 'Brasil';
                    const locMatch = lines.find(l => l.includes('-') && l.length < 30 && !l.includes('Remoto') && !l.includes('Híbrido'));
                    if (locMatch) {
                        location = locMatch;
                    }

                    results.push({
                        title: title,
                        company: 'Coodesh (Múltiplas Empresas)', // Na lista deles às vezes a empresa fica escondida
                        location: work_mode === 'remote' ? 'Remoto' : location,
                        url: url,
                        source: 'Coodesh',
                        work_mode: work_mode
                    });
                }
                
                return results;
            });

            // Filtro rigoroso local para garantir que seja vaga de design
            const validJobs = extractedJobs.filter(j => {
                const titleLower = j.title.toLowerCase();
                const isDesign = includeRegex.test(titleLower);
                const isExcluded = excludeKeywords.some(k => titleLower.includes(k));
                return isDesign && !isExcluded;
            });

            // Remover links duplicados e adicionar ao array final
            validJobs.forEach(job => {
                if (!jobs.find(j => j.url === job.url)) {
                    jobs.push(job);
                }
            });
        } else {
            console.log('Coodesh: Não foi possível localizar o campo de busca.');
        }

    } catch (error) {
        console.error('Erro no scraper da Coodesh:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    
    return jobs;
}

module.exports = scrapeCoodesh;
