require('dotenv').config();
const supabase = require('./utils/supabase');
const greenhouseScraper = require('./scrapers/greenhouse');
const inhireScraper = require('./scrapers/inhire');

async function importNow() {
    console.log('Iniciando importação isolada (Greenhouse + Inhire)...');
    
    let allJobs = [];

    // Roda Greenhouse
    try {
        const ghJobs = await greenhouseScraper();
        allJobs = allJobs.concat(ghJobs);
    } catch (e) {
        console.error('Erro Greenhouse:', e);
    }

    // Roda Inhire
    try {
        const inJobs = await inhireScraper();
        allJobs = allJobs.concat(inJobs);
    } catch (e) {
        console.error('Erro Inhire:', e);
    }

    console.log(`Total de vagas colhidas nos novos motores: ${allJobs.length}`);

    if (allJobs.length > 0) {
        console.log('Verificando duplicatas no banco de dados...');
        const { data: existingJobs } = await supabase.from('jobs').select('url');
        const existingUrls = new Set((existingJobs || []).map(j => j.url));
        
        let newJobs = allJobs.filter(j => !existingUrls.has(j.url));
        console.log(`${newJobs.length} vagas são realmente inéditas.`);

        if (newJobs.length > 0) {
            console.log('Injetando vagas no Supabase...');
            const { error } = await supabase.from('jobs').insert(newJobs);
            if (error) {
                console.error('Erro ao inserir no banco:', error.message);
            } else {
                console.log('Sucesso! As vagas já estão salvas na sua base.');
            }
        }
    }
}

importNow();
