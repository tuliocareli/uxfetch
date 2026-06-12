const scrapeVagas = require('./scrapers/vagas');

async function test() {
    console.log('Consultando a página de vagas de UX/Design do Vagas.com.br...');
    const jobs = await scrapeVagas();
    
    if (jobs.length > 0) {
        console.log(`Sucesso! Foram encontradas ${jobs.length} vagas filtradas e validadas.`);
        console.log('Duas primeiras vagas:', JSON.stringify(jobs.slice(0, 2), null, 2));
    } else {
        console.log('Nenhuma vaga da nossa área encontrada hoje nas listagens do Vagas.com.br.');
    }
}

test();
