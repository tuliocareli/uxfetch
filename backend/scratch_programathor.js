const axios = require('axios');
const cheerio = require('cheerio');

async function scrapeJobs() {
    try {
        const { data } = await axios.get('https://programathor.com.br/jobs-front-end');
        const $ = cheerio.load(data);
        
        const jobs = [];
        $('.cell-list').each((i, el) => {
            const title = $(el).find('h3').text().trim();
            if (title) {
                jobs.push(title);
            }
        });
        console.log(`Front-end jobs found: ${jobs.length}`);
    } catch (error) {
        console.error('Erro:', error.message);
    }
}

scrapeJobs();
