require('dotenv').config();
const scrapeWWR = require('./scrapers/wwr');
const scrapeGreenhouse = require('./scrapers/greenhouse');
const scrapeInhire = require('./scrapers/inhire');

async function run() {
    console.log("=== TESTANDO WWR ===");
    try {
        const wwrJobs = await scrapeWWR();
        console.log(`Vagas WWR retornadas: ${wwrJobs.length}`);
        wwrJobs.forEach(j => {
            console.log(`- ${j.title} (${j.is_international ? 'Internacional' : 'Nacional'})`);
            console.log(`  Desc: ${j.description.substring(0, 100)}...`);
        });
    } catch (e) {
        console.error("Erro no WWR:", e);
    }
}

run();
