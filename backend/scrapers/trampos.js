const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeTrampos() {
    console.log('[Trampos] Iniciando scraping com Axios+Cheerio...');
    const jobs = [];
    
    try {
        // TODO: Lógica real de scraping
        // const response = await axios.get('https://trampos.co/oportunidades?q=ux');
        // const $ = cheerio.load(response.data);
        
        console.log('[Trampos] MOCK - Retornando vagas de teste');
        jobs.push({
            title: 'UX/UI Designer Pleno',
            company: 'Agência Y',
            location: 'São Paulo, SP',
            is_remote: false,
            url: 'https://trampos.co/oportunidades/456',
            source: 'Trampos.co'
        });

    } catch (error) {
        console.error('[Trampos] Erro:', error);
    }
    
    return jobs;
}

module.exports = scrapeTrampos;
