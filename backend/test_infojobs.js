const scrapeInfojobs = require('./scrapers/infojobs');

async function test() {
    console.log('Consultando a página de vagas de UX/Design do Infojobs...');
    const jobs = await scrapeInfojobs();
    
    if (jobs.length > 0) {
        console.log(`Sucesso! Foram encontradas ${jobs.length} vagas validadas e NÃO-confidenciais.`);
        console.log('Duas primeiras vagas:', JSON.stringify(jobs.slice(0, 2), null, 2));
    } else {
        console.log('Nenhuma vaga da nossa área encontrada hoje nas listagens abertas do Infojobs.');
    }
}

test();
