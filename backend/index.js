require('dotenv').config();
const supabase = require('./utils/supabase');

// Import scrapers
const remotarScraper = require('./scrapers/remotar');
const tramposScraper = require('./scrapers/trampos');

async function main() {
    console.log('Iniciando orquestrador de scrapers...');

    const scrapers = [
        { name: 'Remotar', run: remotarScraper },
        { name: 'Trampos', run: tramposScraper }
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
        console.log('Salvando no Supabase...');
        // Upsert on 'url' column to avoid duplicates
        const { data: upsertData, error: upsertError } = await supabase
            .from('jobs')
            .upsert(allJobs, { onConflict: 'url' });

        if (upsertError) {
            console.error('Erro ao salvar no Supabase:', upsertError);
        } else {
            console.log('Vagas salvas/atualizadas com sucesso!');
            
            // FASE DE DISPARO DE E-MAIL
            console.log('Buscando inscritos ativos para disparo de e-mails...');
            const { data: subscribers, error: subError } = await supabase
                .from('subscribers')
                .select('*')
                .eq('is_active', true);
                
            if (subError) {
                console.error('Erro ao buscar inscritos:', subError);
            } else if (subscribers && subscribers.length > 0) {
                console.log(`Disparando e-mail para ${subscribers.length} inscrito(s)...`);
                const { sendDailyEmail } = require('./utils/mailer');
                
                for (const sub of subscribers) {
                    // TODO: Aqui implementaríamos a lógica de MATCH (Fase 5) para cruzar
                    // o "accept_remote" e a "cidade" do usuário com as vagas.
                    // Por enquanto, enviamos todas as vagas como teste.
                    await sendDailyEmail(sub, allJobs);
                }
            } else {
                console.log('Nenhum inscrito ativo encontrado.');
            }
        }
    }

    console.log('Orquestrador finalizado.');
}

main();
