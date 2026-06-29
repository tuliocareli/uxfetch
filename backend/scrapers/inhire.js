const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function scrapeInhire() {
    console.log('[Inhire] Iniciando scraper multi-empresas...');
    let allJobs = [];
    let browser;

    const companies = [
        { id: 'zup', name: 'Zup Innovation' },
        { id: 'olist', name: 'Olist' },
        { id: 'meliuz', name: 'Méliuz' },
        { id: 'cora', name: 'Cora' },
        { id: 'alice', name: 'Alice' },
        { id: 'flash', name: 'Flash' },
        { id: 'credipronto', name: 'Credipronto' },
        { id: 'rocketseat', name: 'Rocketseat' },
        { id: 'dock', name: 'Dock' },
        { id: 'solfacil', name: 'Solfácil' },
        { id: 'contaazul', name: 'Conta Azul' },
        { id: 'nibo', name: 'Nibo' },
        { id: 'credaluga', name: 'Credaluga' },
        { id: 'dtidigital', name: 'dti digital' },
        { id: 'celcoin', name: 'Celcoin' }
    ];

    const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|motion\s+graphics|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|designer\b|videomaker|editor(a)?\s+de\s+v[ií]deo|audiovisual|edi[çc][ãa]o\s+de\s+v[ií]deo)/i;
    const excludeKeywords = [
        'desenvolvedor', 'developer', 'arquiteto', 'architect', 
        'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
        'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
                'moda', 'interiores', 'produto físico', 'embalagem',   'performance',
        'sobrancelha', 'sobrancelhas', 'unha', 'unhas', 'cílios', 'cilios', 'micropigmentação'
    , 'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'
        ];

    try {
        browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        // Processa sequencialmente para evitar travamentos de CPU/Memória do Puppeteer
        for (const company of companies) {
            console.log(`[Inhire] Acessando portal da ${company.name}...`);
            let page;
            try {
                page = await browser.newPage();
                
                // Bloqueia imagens/css para acelerar
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });

                const url = `https://${company.id}.inhire.app/vagas`;
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                
                // Aguarda as vagas aparecerem na tela
                await page.waitForSelector('a[href*="/vaga"], a[href*="/v/"]', { timeout: 10000 }).catch(() => {});
                await new Promise(r => setTimeout(r, 2000));

                let previousHeight;
                for (let j = 0; j < 8; j++) {
                    previousHeight = await page.evaluate('document.body.scrollHeight');
                    await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
                    
                    const loadClicked = await page.evaluate(() => {
                        const btns = Array.from(document.querySelectorAll('button'));
                        const loadBtn = btns.find(b => {
                            const t = b.innerText.toLowerCase();
                            return t.includes('mais') || t.includes('carregar') || t.includes('load') || t.includes('more') || t.includes('see') || t.includes('ver');
                        });
                        if (loadBtn) {
                            loadBtn.click();
                            return true;
                        }
                        return false;
                    });

                    await new Promise(r => setTimeout(r, 2000));
                    let newHeight = await page.evaluate('document.body.scrollHeight');
                    if (newHeight === previousHeight && !loadClicked) {
                        await new Promise(r => setTimeout(r, 1500));
                        newHeight = await page.evaluate('document.body.scrollHeight');
                        if (newHeight === previousHeight) break;
                    }
                }

                const extractedJobs = await page.evaluate(() => {
                    const links = Array.from(document.querySelectorAll('a'))
                        .filter(a => a.href.includes('/vaga') || a.href.includes('/v/'));
                    
                    const results = [];
                    for (const a of links) {
                        const href = a.href;
                        
                        let card = a.parentElement;
                        while (card && card.tagName !== 'DIV' && card.parentElement) {
                            card = card.parentElement;
                        }
                        if (card && card.innerText.length < 20 && card.parentElement) {
                            card = card.parentElement;
                        }
                        
                        const textContent = card ? card.innerText.trim() : a.innerText.trim();
                        if (!textContent) continue;

                        const lines = textContent.split('\n').map(l => l.trim()).filter(l => l);
                        if (lines.length === 0) continue;

                        const title = lines[0];
                        results.push({
                            title: title,
                            rawText: textContent,
                            url: href
                        });
                    }
                    return results;
                });

                let count = 0;
                for (const job of extractedJobs) {
                    const titleLower = job.title.toLowerCase();
                    const isDesign = includeRegex.test(titleLower);
                    const isExcluded = excludeKeywords.some(k => titleLower.includes(k));

                    if (isDesign && !isExcluded) {
                        const textLower = job.rawText.toLowerCase();
                        let work_mode = 'in_person';
                        if (textLower.includes('remot')) {
                            work_mode = 'remote';
                        } else if (textLower.includes('híbrid') || textLower.includes('hybrid')) {
                            work_mode = 'hybrid';
                        }

                        let location = 'Brasil';
                        const locMatch = job.rawText.split('\n').find(l => l.includes('-') && l.length < 40 && !l.toLowerCase().includes('remoto') && !l.toLowerCase().includes('híbrido'));
                        if (locMatch) {
                            location = locMatch.trim();
                        }

                        let is_international = false;
                        if (textLower.includes('internacional') && work_mode === 'remote') {
                            is_international = true;
                        }

                        let description = `Vaga encontrada pelo UX Fetch.`;
                            try {
                                const descPage = await browser.newPage();
                                await descPage.goto(job.url, {waitUntil: 'domcontentloaded', timeout: 10000});
                                const descText = await descPage.evaluate(() => document.body.innerText);
                                if (descText) {
                                    const cleanHtml = descText.replace(/\s+/g, ' ').trim();
                                    // Pular cabeçalhos genéricos
                                    const startIndex = cleanHtml.indexOf('Descrição') > -1 ? cleanHtml.indexOf('Descrição') : 0;
                                    description = cleanHtml.substring(startIndex, startIndex + 150).trim() + '...';
                                }
                                await descPage.close();
                            } catch (e) {
                                console.error(`Erro ao buscar descrição da vaga ${job.url}:`, e.message);
                            }

                            allJobs.push({
                                title: job.title,
                                company: company.name,
                                location: work_mode === 'remote' ? 'Remoto' : location,
                                url: job.url,
                                source: 'Inhire',
                                work_mode: work_mode,
                                is_remote: work_mode === 'remote',
                                is_international: is_international,
                                description: description
                            });
                            count++;
                        }
                    }
                    console.log(`[Inhire] ${count} vagas de UX aprovadas para ${company.name}.`);

                } catch (error) {
                    console.error(`[Inhire] Erro ao raspar ${company.name}:`, error.message);
                } finally {
                    if (page) {
                        await page.close().catch(() => {});
                    }
                }
            }

    } catch (error) {
        console.error('[Inhire] Erro crítico no inicializador do Puppeteer:', error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    // Remover duplicatas baseadas na URL
    const uniqueJobs = [];
    allJobs.forEach(job => {
        if (!uniqueJobs.find(j => j.url === job.url)) {
            uniqueJobs.push(job);
        }
    });

    console.log(`[Inhire] Sucesso! Foram formatadas ${uniqueJobs.length} vagas totais exclusivas.`);
    return uniqueJobs;
}

module.exports = scrapeInhire;
