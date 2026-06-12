const axios = require('axios');
const cheerio = require('cheerio');

async function dumpHTML() {
    try {
        const { data } = await axios.get('https://www.infojobs.com.br/vagas-de-emprego-ux-designer.aspx', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        const $ = cheerio.load(data);
        
        // Find the first job card container and log its HTML to understand the structure
        const firstJobHtml = $('.js_vacancyId').first().html() || $('.element-vaga').first().html() || $('[data-id]').first().html();
        console.log(firstJobHtml);
    } catch(e) {}
}
dumpHTML();
