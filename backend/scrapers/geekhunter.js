const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeGeekHunter() {
    let browser;
    let jobs = [];
    try {
        console.log('Iniciando scraper GeekHunter...');
        browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1000 });
        
        const url = 'https://www.geekhunter.com/pt/vagas';
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        
        await new Promise(r => setTimeout(r, 4000));
        
        // Digitar "ux" no campo de busca para forçar o filtro
        const searchInput = await page.$('input[placeholder*="cargo"]');
        if (searchInput) {
            await searchInput.type('ux');
            await new Promise(r => setTimeout(r, 500));
            await page.keyboard.press('Enter');
            await new Promise(r => setTimeout(r, 5000)); // Aguarda busca carregar
        }
        
        const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|diretor\s+de\s+arte|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|motion\s+graphics|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|designer\b|videomaker|editor(a)?\s+de\s+v[ií]deo|audiovisual|edi[çc][ãa]o\s+de\s+v[ií]deo)/i;
        const excludeKeywords = [
            'desenvolvedor', 'developer', 'arquiteto', 'architect', 
            'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
            'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
                    'moda', 'interiores', 'produto físico', 'embalagem',   'performance',
            'sobrancelha', 'sobrancelhas', 'unha', 'unhas', 'cílios', 'cilios', 'micropigmentação'
        , 'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'
        ];
        
        
        // Esperar a hidratação do Next.js
        await new Promise(r => setTimeout(r, 5000));
        
        let hasNextPage = true;
        let pageCount = 1;

        while (hasNextPage && pageCount <= 5) { // Limite de 5 páginas de segurança
            console.log(`GeekHunter: Raspando página ${pageCount}...`);
            
            const extractedJobs = await page.evaluate(() => {
                const jobNodes = Array.from(document.querySelectorAll('a[href*="/jobs/"]'));
                const results = [];
                
                // Em sites Next.js (App Router), os links contêm o card da vaga
                for (const node of jobNodes) {
                    const href = node.href;
                    
                    let card = node.parentElement;
                    while (card && card.tagName !== 'DIV' && card.parentElement) {
                        card = card.parentElement;
                    }
                    
                    const textContent = card ? card.innerText : node.innerText;
                    if (!textContent.trim()) continue;
                    
                    const lines = textContent.split('\n').map(l => l.trim()).filter(l => l);
                    if (lines.length < 2) continue;

                    // A primeira linha costuma ser o cargo, e as outras são tags (remoto, nível, empresa)
                    // Em alguns casos, a primeira linha é 'x vagas disponíveis', então procuramos a vaga
                    let titleIndex = 0;
                    if (lines[0].toLowerCase().includes('vagas disponíveis')) {
                        titleIndex = 2; // Pula 'vagas disponíveis' e 'Mais recentes'
                    }
                    const title = lines.length > titleIndex ? lines[titleIndex] : lines[0];
                    // Se não tiver UX/Product Designer no nome, podemos pular (filtrar depois)
                    
                    // Extrair Modalidade
                    let work_mode = 'in_person';
                    const textLower = textContent.toLowerCase();
                    if (textLower.includes('remoto')) {
                        work_mode = 'remote';
                    } else if (textLower.includes('híbrido') || textLower.includes('hibrido')) {
                        work_mode = 'hybrid';
                    }

                    // Tentar achar a localização na string
                    let location = 'Brasil'; // Padrão
                    const locationMatch = lines.find(l => l.match(/^[A-Z][a-z]+ - [A-Z]{2}$/) || l.includes(' - '));
                    if (locationMatch && !locationMatch.toLowerCase().includes('remoto')) {
                        location = locationMatch;
                    }

                    // Extrair empresa (geralmente uma das linhas após o título)
                    let company = 'GeekHunter (Empresa Confidencial)';
                    if (lines.length > 1) {
                        company = lines[1];
                    }

                    results.push({
                        title: title,
                        company: company,
                        location: work_mode === 'remote' ? 'Remoto' : location,
                        url: href,
                        source: 'GeekHunter',
                        work_mode: work_mode,
                        is_remote: work_mode === 'remote'
                    });
                }
                
                return results;
            });

            // Filtro local para garantir que seja vaga de design
            const validJobs = extractedJobs.filter(j => {
                const titleLower = j.title.toLowerCase();
                const isDesign = includeRegex.test(titleLower);
                const isExcluded = excludeKeywords.some(k => titleLower.includes(k));
                return isDesign && !isExcluded;
            });
            
            // Removemos as já existentes nesta raspagem (para evitar duplicidade na mesma página)
            validJobs.forEach(job => {
                if (!jobs.find(j => j.url === job.url)) {
                    jobs.push(job);
                }
            });

            // Procurar botão de Próxima Página (que não esteja disabled)
            const nextButton = await page.$('button[aria-label="Próxima página"]:not([disabled]), button[title*="Próxim"]:not([disabled])');
            if (nextButton) {
                await nextButton.click();
                await new Promise(r => setTimeout(r, 4000)); // Espera hidratar a próxima página
                pageCount++;
            } else {
                hasNextPage = false;
            }
        }
        
    } catch (error) {
        console.error('Erro no scraper da GeekHunter:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
    
    return jobs;
}

module.exports = scrapeGeekHunter;
