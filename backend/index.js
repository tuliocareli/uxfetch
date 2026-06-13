require('dotenv').config();
const supabase = require('./utils/supabase');

// Import scrapers
const remotarScraper = require('./scrapers/remotar');
const tramposScraper = require('./scrapers/trampos');
const solidesScraper = require('./scrapers/solides');
const gupyScraper = require('./scrapers/gupy');
const programathorScraper = require('./scrapers/programathor');
const vagasScraper = require('./scrapers/vagas');
const infojobsScraper = require('./scrapers/infojobs');
const wwrScraper = require('./scrapers/wwr');

async function main() {
    console.log('Iniciando orquestrador de scrapers...');

    const scrapers = [
        { name: 'Remotar', run: remotarScraper },
        { name: 'Trampos', run: tramposScraper },
        { name: 'Sólides', run: solidesScraper },
        { name: 'Gupy', run: gupyScraper },
        { name: 'Programathor', run: programathorScraper },
        { name: 'Vagas.com.br', run: vagasScraper },
        { name: 'Infojobs', run: infojobsScraper },
        { name: 'We Work Remotely', run: wwrScraper }
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
        
        let newJobs = allJobs.filter(j => !existingUrls.has(j.url));
        
        // Intercala vagas nacionais e internacionais (3 pra 1) para o e-mail
        const nationalJobs = newJobs.filter(j => !j.is_international);
        const intlJobs = newJobs.filter(j => j.is_international);
        const interleaved = [];
        let nIdx = 0, iIdx = 0;
        while (nIdx < nationalJobs.length || iIdx < intlJobs.length) {
            for (let k = 0; k < 3 && nIdx < nationalJobs.length; k++) {
                interleaved.push(nationalJobs[nIdx++]);
            }
            if (iIdx < intlJobs.length) {
                interleaved.push(intlJobs[iIdx++]);
            }
        }
        newJobs = interleaved;
        
        console.log(`Vagas inéditas encontradas hoje: ${newJobs.length}`);

        console.log('Salvando/Atualizando histórico no Supabase...');
        // Limpa chaves temporárias de uso interno para evitar erro PGRST204
        const cleanJobs = allJobs.map(j => {
            const { needsDeepCheck, ...cleanJob } = j;
            return cleanJob;
        });

        const { error: upsertError } = await supabase
            .from('jobs')
            .upsert(cleanJobs, { onConflict: 'url' });

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
                    
                    // Busca vagas recentes (últimos 7 dias)
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                    const { data: recentJobsData, error: recentJobsError } = await supabase
                        .from('jobs')
                        .select('*')
                        .gte('created_at', sevenDaysAgo.toISOString());

                    let recentJobs = [];
                    if (!recentJobsError && recentJobsData) {
                        const newJobsUrls = new Set(newJobs.map(j => j.url));
                        const validRecentJobs = recentJobsData.filter(j => !newJobsUrls.has(j.url));
                        
                        // Sorteia até 3 vagas
                        const shuffled = validRecentJobs.sort(() => 0.5 - Math.random());
                        recentJobs = shuffled.slice(0, 3);
                    } else if (recentJobsError) {
                        console.error('Erro ao buscar vagas recentes:', recentJobsError);
                    }

                    for (const sub of subscribers) {
                        await sendDailyEmail(sub, newJobs, recentJobs);
                    }
                } else {
                    console.log('Nenhum inscrito ativo encontrado.');
                }
            } else {
                console.log('Nenhuma vaga inédita para enviar hoje. Pulando disparo de e-mails para não gerar spam.');
            }
        }
    }

    console.log('Executando limpeza de banco de dados (Removendo vagas com mais de 30 dias)...');
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { error: deleteError } = await supabase
            .from('jobs')
            .delete()
            .lt('created_at', thirtyDaysAgo.toISOString());
            
        if (deleteError) {
            console.error('Erro ao limpar vagas antigas:', deleteError);
        } else {
            console.log('Limpeza concluída com sucesso!');
        }
    } catch (error) {
        console.error('Erro inesperado na rotina de limpeza:', error);
    }

    console.log('Orquestrador finalizado.');
}

main().catch(error => {
    console.error('Fatal error in main orchestrator:', error);
    process.exit(1);
});
