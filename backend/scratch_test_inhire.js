const inhireScraper = require('./scrapers/inhire');

(async () => {
    try {
        console.log('Iniciando teste do Inhire...');
        const testCompanies = [{ id: 'credaluga', name: 'Credaluga' }];
        console.log('[Inhire] Iniciando scraper multi-empresas apenas para Credaluga...');
        const jobs = await inhireScraper(testCompanies);
        console.log(`Finalizado. ${jobs.length} vagas encontradas.`);
        console.log(JSON.stringify(jobs, null, 2));
    } catch (e) {
        console.error('Erro no teste:', e);
    }
})();
