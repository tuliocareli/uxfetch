const scrapeProgramathor = require('./scrapers/programathor');

async function test() {
    console.log('Consultando a verdadeira API do Programathor...');
    const jobs = await scrapeProgramathor();
    
    if (jobs.length > 0) {
        console.log(`Sucesso! Foram encontradas ${jobs.length} vagas de design.`);
        console.log('Primeira vaga:', JSON.stringify(jobs[0], null, 2));
    } else {
        console.log('Nenhuma vaga da nossa área encontrada hoje nas listagens do Programathor.');
    }
}

test();
