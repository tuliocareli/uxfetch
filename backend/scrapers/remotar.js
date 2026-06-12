const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const cheerio = require('cheerio');
puppeteer.use(StealthPlugin());

async function scrapeRemotar() {
    console.log('[Remotar] Iniciando scraping...');
    const jobs = [];
    let browser;
    try {
        browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);

        const queries = ['product design', 'ux', 'ui', 'design engineer', 'design ops', 'staff designer'];
        const extractedJobs = [];

        // Acessa a página principal uma vez
        await page.goto('https://remotar.com.br/', { waitUntil: 'networkidle2' });
        
        for (const query of queries) {
            console.log(`[Remotar] Buscando vagas para: ${query}...`);
            
            await page.waitForSelector('input[placeholder="Insira sua busca"]');
            await page.click('input[placeholder="Insira sua busca"]', { clickCount: 3 });
            await page.keyboard.press('Backspace');
            
            await page.type('input[placeholder="Insira sua busca"]', query, { delay: 50 });
            await page.keyboard.press('Enter');
            
            await new Promise(r => setTimeout(r, 4000));

            const queryJobs = await page.evaluate(() => {
                const results = [];
                const jobLinks = Array.from(document.querySelectorAll('a[href^="/job/"], a[href^="https://remotar.com.br/job/"]'));
                
                jobLinks.forEach(link => {
                    const title = link.innerText.trim();
                    const url = link.href;
                    
                    const parts = new URL(url).pathname.split('/');
                    let company = parts[3] ? parts[3].replace(/-/g, ' ') : 'Empresa Oculta';
                    company = company.charAt(0).toUpperCase() + company.slice(1);

                    if(title && url && title.length > 3) {
                        results.push({
                            title: title,
                            company: company,
                            location: 'Remoto',
                            is_remote: true, 
                            url: url,
                            source: 'Remotar',
                            description: '' // Será preenchido na próxima etapa
                        });
                    }
                });
                return results;
            });

            extractedJobs.push(...queryJobs);
        }

        // Remove duplicatas
        const uniqueJobs = Array.from(new Map(extractedJobs.map(j => [j.url, j])).values());
        
        // Filtro de segurança rigoroso para Produto/Design
        const includeRegex = /\b(ux|ui|product design|product designer|design engineer|designer|research|researcher|design ops|staff designer)\b/i;
        const excludeKeywords = [
            'desenvolvedor', 'developer', 'arquiteto', 'architect', 
            'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
            'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data'
        ];

        const filtered = uniqueJobs.filter(job => {
            const t = job.title.toLowerCase();
            // Verifica se contém palavras proibidas
            const isExcluded = excludeKeywords.some(bad => t.includes(bad));
            if (isExcluded) return false;
            
            // Verifica se dá match EXATO com a palavra isolada (ex: UI e não arqUIteto)
            return includeRegex.test(t);
        });

        console.log(`[Remotar] Extraindo descrição para ${filtered.length} vagas...`);
        // Extrai a descrição real de cada vaga usando Axios para ser rápido
        for (let job of filtered) {
            try {
                const { data } = await axios.get(job.url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }
                });
                const $ = cheerio.load(data);
                // O texto da vaga geralmente fica espalhado em divs e parágrafos.
                // Limpar CSS e JS para não vazar pro email
                $('script, style, noscript, iframe, nav, header, footer, svg, img').remove();
                
                // Vamos pegar o texto do body, remover quebras de linha e excesso de espaços.
                let fullText = $('body').text().replace(/\s+/g, ' ').trim();
                
                // Procurar onde a descrição útil começa (depois do header genérico)
                // Usualmente a parte de "Descrição" ou "Sobre a vaga" ajuda, mas para garantir:
                const limit = 250; 
                // Avança um pouco no texto para pular o menu e cabeçalhos (heurística: a partir do caractere 300)
                let excerpt = fullText.substring(300, 300 + limit).trim();
                
                if (excerpt.length > 10) {
                    job.description = excerpt + '...';
                } else {
                    job.description = `Oportunidade de ${job.title} na ${job.company}. Confira todos os detalhes acessando o link da vaga...`;
                }
            } catch (err) {
                job.description = `Oportunidade de ${job.title} na ${job.company}. Confira todos os detalhes acessando o link da vaga...`;
            }
        }

        jobs.push(...filtered);
        console.log(`[Remotar] Foram encontradas e formatadas ${filtered.length} vagas exclusivas de Design.`);

    } catch (error) {
        console.error('[Remotar] Erro:', error);
    } finally {
        if (browser) await browser.close();
    }
    
    return jobs;
}

module.exports = scrapeRemotar;
