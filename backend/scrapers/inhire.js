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
        { id: 'nibo', name: 'Nibo' }
    ];

    const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?)/i;
    const excludeKeywords = [
        'desenvolvedor', 'developer', 'arquiteto', 'architect', 
        'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
        'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
        'gráfico', 'grafico', 'graphic', 'motion', 'video', 'vídeo', 'audiovisual', '3d', 'moda', 'interiores', 'produto físico', 'embalagem', 'marketing', 'social media', 'performance',
        'sobrancelha', 'sobrancelhas', 'unha', 'unhas', 'cílios', 'cilios', 'micropigmentação'
    ];

    try {
        browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1000 });

        for (const company of companies) {
            try {
                console.log(`[Inhire] Acessando portal da ${company.name}...`);
                const url = `https://${company.id}.inhire.app/vagas`;
                
                await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
                await new Promise(r => setTimeout(r, 4000)); // Esperar hidratação ou loadings

                const extractedJobs = await page.evaluate(() => {
                    // Inhire usa URLs contendo /vaga/ ou /v/
                    const links = Array.from(document.querySelectorAll('a'))
                        .filter(a => a.href.includes('/vaga/') || a.href.includes('/v/'));
                    
                    const results = [];
                    for (const a of links) {
                        const href = a.href;
                        
                        let card = a.parentElement;
                        // Sobe na árvore DOM para achar o container do card
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

                        // Título costuma ser a primeira linha
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
                    const textLower = job.rawText.toLowerCase();

                    const isDesign = includeRegex.test(titleLower);
                    const isExcluded = excludeKeywords.some(k => titleLower.includes(k));

                    if (isDesign && !isExcluded) {
                        let work_mode = 'in_person';
                        if (textLower.includes('remot')) {
                            work_mode = 'remote';
                        } else if (textLower.includes('híbrid') || textLower.includes('hybrid')) {
                            work_mode = 'hybrid';
                        }

                        // Localização
                        let location = 'Brasil';
                        const locMatch = job.rawText.split('\n').find(l => l.includes('-') && l.length < 40 && !l.toLowerCase().includes('remoto') && !l.toLowerCase().includes('híbrido'));
                        if (locMatch) {
                            location = locMatch.trim();
                        }

                        let is_international = false;
                        if (textLower.includes('internacional') && work_mode === 'remote') {
                            is_international = true;
                        }

                        let description = 'Vaga encontrada pelo UX Fetch.';
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
