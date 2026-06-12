require('dotenv').config();
const supabase = require('./utils/supabase');

// Import scrapers
const remotarScraper = require('./scrapers/remotar');
const tramposScraper = require('./scrapers/trampos');
const solidesScraper = require('./scrapers/solides');

async function main() {
    console.log('Iniciando orquestrador de scrapers...');

    const scrapers = [
        { name: 'Remotar', run: remotarScraper },
        { name: 'Trampos', run: tramposScraper },
        { name: 'Sólides', run: solidesScraper }
    ];

    const results = await Promise.allSettled(scrapers.map(s => s.run()));

    let allJobs = [];

    results.forEach((result, index) => {
        const scraperName = scrapers[index].name;
        if (result.status === 'fulfilled') {
            console.log(`✅ [${scraperName}] retornou ${result.value.length} vagas.`);
            allJobs = allJobs.concat(result.value);
        } else {
            console.error(`❌ [${scraperName}] falhou:`, result.reason);
        }
    });

    console.log(`Total de vagas coletadas: ${allJobs.length}`);

    if (allJobs.length > 0) {
        console.log('Filtrando vagas repetidas...');
        const { data: existingJobs } = await supabase.from('jobs').select('url');
        const existingUrls = new Set((existingJobs || []).map(j => j.url));
        
        const newJobs = allJobs.filter(j => !existingUrls.has(j.url));
        console.log(`Vagas inéditas encontradas hoje: ${newJobs.length}`);

        console.log('Salvando/Atualizando histórico no Supabase...');
        // Continua salvando tudo no Supabase para manter o histórico vivo
        const { data: upsertData, error: upsertError } = await supabase
            .from('jobs')
            .upsert(allJobs, { onConflict: 'url' });

        if (upsertError) {
            console.error('Erro ao salvar no Supabase:', upsertError);
        } else {
            console.log('Vagas salvas/atualizadas com sucesso!');
            
            // FASE DE DISPARO DE E-MAIL (Somente se houver inéditas)
            if (newJobs.length > 0) {
                console.log('Buscando inscritos ativos para disparo de e-mails...');
                const { data: subscribers, error: subError } = await supabase
                    .from('subscribers')
                    .select('*')
                    .eq('is_active', true);
                    
                if (subError) {
                    console.error('Erro ao buscar inscritos:', subError);
                } else if (subscribers && subscribers.length > 0) {
                    console.log(`Disparando e-mail com ${newJobs.length} vagas inéditas para ${subscribers.length} inscrito(s)...`);
                    const { sendDailyEmail } = require('./utils/mailer');
                    
                    for (const sub of subscribers) {
                        await sendDailyEmail(sub, newJobs);
                    }
                } else {
                    console.log('Nenhum inscrito ativo encontrado.');
                }
            } else {
                console.log('Nenhuma vaga inédita para enviar hoje. Pulando disparo de e-mails para não gerar spam.');
            }
        }
    }

    console.log('Orquestrador finalizado.');
}

main();
