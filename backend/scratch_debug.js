const axios = require('axios');
const cheerio = require('cheerio');

async function check() {
    const { data } = await axios.get('https://www.infojobs.com.br/vagas-de-emprego-ux-designer.aspx');
    const $ = cheerio.load(data);
    
    console.log('.js_vacancyId:', $('.js_vacancyId').length);
    console.log('.element-vaga:', $('.element-vaga').length);
    console.log('[data-id]:', $('[data-id]').length);
    console.log('.js_vacancyTitle:', $('.js_vacancyTitle').length);
}
check();
