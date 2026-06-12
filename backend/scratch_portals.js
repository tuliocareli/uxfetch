const axios = require('axios');
const cheerio = require('cheerio');

async function testPortals() {
    console.log('Testando Infojobs...');
    try {
        const { status, data } = await axios.get('https://www.infojobs.com.br/vagas-de-emprego-ux-designer.aspx', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' },
            timeout: 10000
        });
        const $ = cheerio.load(data);
        const jobs = $('.js_vacancyId').length || $('.element-vaga').length || $('[data-id]').length;
        console.log(`Infojobs Status: ${status} | Possíveis vagas no HTML: ${jobs}`);
    } catch(e) {
        console.log(`Infojobs Erro: ${e.message}`);
    }

    console.log('\nTestando Glassdoor...');
    try {
        const { status, data } = await axios.get('https://www.glassdoor.com.br/Vagas/ux-designer-vagas-SRCH_KO0,11.htm', {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' },
            timeout: 10000
        });
        const $ = cheerio.load(data);
        // Glassdoor usually uses li with specific classes for jobs, like .react-job-listing or .JobCard_jobCardContainer
        const jobs = $('li.react-job-listing').length || $('[data-test="job-link"]').length || $('li').length;
        console.log(`Glassdoor Status: ${status} | Possíveis vagas no HTML: ${jobs} (Se o HTML for gigante e sem vagas claras, pode ser Datadome/Cloudflare)`);
        
        // Verifica se é Cloudflare ou Datadome
        if (data.includes('cloudflare') || data.includes('datadome') || data.includes('captcha')) {
            console.log('Glassdoor Detectou: Proteção Anti-bot Ativada (Datadome/Cloudflare)');
        }
    } catch(e) {
        console.log(`Glassdoor Erro: ${e.message}`);
    }
}
testPortals();
