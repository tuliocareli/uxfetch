require('dotenv').config();
const supabase = require('./utils/supabase');
const wwrScraper = require('./scrapers/wwr');

async function insertWWR() {
    console.log('Executando scraper do WWR de forma avulsa para popular o banco de dados...');
    const jobs = await wwrScraper();
    
    if (jobs.length > 0) {
        console.log(`Foram retornadas ${jobs.length} vagas prontas. Salvando no Supabase...`);
        
        // Limpa campos indesejados caso existam internamente
        const cleanJobs = jobs.map(j => {
            const { needsDeepCheck, ...cleanJob } = j;
            return cleanJob;
        });

        const { error } = await supabase
            .from('jobs')
            .upsert(cleanJobs, { onConflict: 'url' });

        if (error) {
            console.error('❌ Erro ao salvar no Supabase:', error);
        } else {
            console.log(`✅ Sucesso absoluto! ${jobs.length} vagas foram inseridas/atualizadas no banco de dados.`);
        }
    } else {
        console.log('Nenhuma vaga validada retornou do scraper.');
    }
}

insertWWR().catch(console.error);
