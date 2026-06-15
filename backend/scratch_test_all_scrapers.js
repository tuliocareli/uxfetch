const scrapers = [
    { name: 'Remotar', run: require('./scrapers/remotar') },
    { name: 'Trampos', run: require('./scrapers/trampos') },
    { name: 'Sólides', run: require('./scrapers/solides') },
    { name: 'Gupy', run: require('./scrapers/gupy') },
    { name: 'Programathor', run: require('./scrapers/programathor') },
    { name: 'Vagas.com.br', run: require('./scrapers/vagas') },
    { name: 'Infojobs', run: require('./scrapers/infojobs') },
    { name: 'We Work Remotely', run: require('./scrapers/wwr') },
    { name: 'GeekHunter', run: require('./scrapers/geekhunter') },
    { name: 'Coodesh', run: require('./scrapers/coodesh') }
];

async function testAll() {
    console.log('--- INICIANDO TESTE DOS SCRAPERS ---');
    for (const scraper of scrapers) {
        try {
            console.log(`⏳ Testando ${scraper.name}...`);
            const results = await scraper.run();
            console.log(`✅ [${scraper.name}] Retornou ${results ? results.length : 0} vagas.\n`);
        } catch (err) {
            console.error(`❌ [${scraper.name}] Falhou com erro: ${err.message}\n`);
        }
    }
    console.log('--- FIM DO TESTE ---');
    process.exit(0);
}

testAll();
