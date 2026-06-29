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
        browser = await puppeteer.launch({ 
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setDefaultNavigationTimeout(60000);

        const queries = ['product design', 'ux', 'ui', 'design engineer', 'design ops', 'staff designer', 'design research', 'design system', 'ux researcher', 'ux research', 'graphic design', 'motion design',  'ux writer', 'head de design'];
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
                            work_mode: 'remote',
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
        const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|motion\s+graphics|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|designer\b|videomaker|editor(a)?\s+de\s+v[ií]deo|audiovisual|edi[çc][ãa]o\s+de\s+v[ií]deo)/i;
        
        const excludeKeywords = [
            'desenvolvedor', 'developer', 'arquiteto', 'architect', 
            'tech lead', 'programador', 'engenheiro de software', 'software engineer', 
            'backend', 'frontend', 'front end', 'front-end', 'fullstack', 'full stack', 'data', 'qa', 'tester',
                    'moda', 'interiores', 'produto físico', 'embalagem',   'performance'
        , 'corel draw', 'coreldraw', 'freelancer', 'temporário', 'temporario', 'gráfica', 'grafica', 'impressão', 'impresso'
        ];

        const filtered = uniqueJobs.map(job => {
            const t = job.title.toLowerCase();
            // Verifica se contém palavras proibidas
            const isExcluded = excludeKeywords.some(bad => t.includes(bad));
            if (isExcluded) return null;
            
            // Aceitação por Título
            const matchesTitle = includeRegex.test(t);
            if (!matchesTitle) return null;
            
            job.needsDeepCheck = false;
            return job;
        }).filter(Boolean);

        console.log(`[Remotar] Extraindo descrição para ${filtered.length} vagas...`);
        // Extrai a descrição real de cada vaga usando Axios respeitando o Rate Limiting (Pausa simulando humano)
        for (let job of filtered) {
            try {
                // Delay randômico entre 1.5s e 3.5s para não sobrecarregar o servidor
                const delayMs = Math.floor(Math.random() * (3500 - 1500 + 1)) + 1500;
                await new Promise(r => setTimeout(r, delayMs));

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

                jobs.push(job); // Insere no array final de vagas válidas
            } catch (err) {
                console.error(`[Remotar] Erro ao extrair a vaga ${job.title}:`, err.message);
            }
        }

        console.log(`[Remotar] Foram encontradas e formatadas ${jobs.length} vagas exclusivas de Design.`);

    } catch (error) {
        console.error('[Remotar] Erro:', error);
    } finally {
        if (browser) await browser.close();
    }
    
    return jobs;
}

module.exports = scrapeRemotar;
