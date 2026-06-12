const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeVagas() {
    try {
        const { data } = await axios.get('https://www.vagas.com.br/vagas-de-ux-design');
        const $ = cheerio.load(data);
        const jobs = [];
        
        $('.vaga, .job, article, li.vaga, .link-detalhes-vaga').each((i, el) => {
            const $el = $(el);
            // In vagas.com.br usually the job card is inside an `article` or `li` or `.vaga`
            const title = $el.find('h2, .cargo').text().trim() || $el.text().trim();
            const company = $el.find('.empresa').text().trim();
            const location = $el.find('.localizacao, .cidade').text().trim();
            const link = $el.find('a').attr('href') || $el.attr('href');
            
            if (title && link) {
                jobs.push({ title, company, location, link });
            }
        });
        
        console.log(`Encontradas ${jobs.length} vagas com seletores genéricos.`);
        if (jobs.length > 0) {
            console.log(jobs.slice(0, 3));
        } else {
            console.log("No jobs found. Let's dump the first 5 hrefs that look like jobs:");
            const links = [];
            $('a').each((i, el) => {
                const href = $(el).attr('href');
                if (href && href.startsWith('/vagas/')) links.push(href);
            });
            console.log([...new Set(links)].slice(0, 5));
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

scrapeVagas();
