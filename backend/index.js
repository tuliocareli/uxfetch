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
const geekhunterScraper = require('./scrapers/geekhunter');
const coodeshScraper = require('./scrapers/coodesh');
const greenhouseScraper = require('./scrapers/greenhouse');
const inhireScraper = require('./scrapers/inhire');
const ilegraScraper = require('./scrapers/ilegra');

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
        { name: 'We Work Remotely', run: wwrScraper },
        { name: 'GeekHunter', run: geekhunterScraper },
        { name: 'Coodesh', run: coodeshScraper },
        { name: 'Greenhouse', run: greenhouseScraper },
        { name: 'Inhire', run: inhireScraper },
        { name: 'Ilegra', run: ilegraScraper }
    ];

    let allJobs = [];

    // Execução sequencial para evitar sobrecarga de memória (Puppeteer instances)
    for (const scraper of scrapers) {
        try {
            console.log(`⏳ Executando scraper: ${scraper.name}...`);
            const result = await scraper.run();
            console.log(`✅ [${scraper.name}] retornou ${result.length} vagas.`);
            allJobs = allJobs.concat(result);
        } catch (error) {
            console.error(`❌ [${scraper.name}] falhou:`, error);
        }
    }

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

        const { data: insertedJobs, error: upsertError } = await supabase
            .from('jobs')
            .upsert(cleanJobs, { onConflict: 'url' })
            .select();

        if (upsertError) {
            console.error('Erro ao salvar no Supabase:', upsertError);
        } else {
            console.log('Vagas salvas/atualizadas com sucesso!');

            // Atribui os IDs corretos do banco de dados de volta às vagas inéditas em memória
            if (insertedJobs && insertedJobs.length > 0) {
                newJobs = newJobs.map(job => {
                    const dbJob = insertedJobs.find(j => j.url === job.url);
                    if (dbJob) {
                        job.id = dbJob.id;
                    }
                    return job;
                });
            }
            
            // FASE DE DISPARO DE E-MAIL
            console.log('Buscando inscritos ativos para disparo de e-mails...');
            const { data: subscribers, error: subError } = await supabase
                .from('subscribers')
                .select('*')
                .eq('is_active', true);
                
            if (subError) {
                console.error('Erro ao buscar inscritos:', subError);
            } else if (subscribers && subscribers.length > 0) {
                console.log(`Preparando disparo de e-mails para ${subscribers.length} inscrito(s)...`);
                const { sendDailyEmail } = require('./utils/mailer');
                
                // Busca vagas antigas (últimos 30 dias) para preenchimento de cota (backfill)
                const thirtyDaysAgoForBackfill = new Date();
                thirtyDaysAgoForBackfill.setDate(thirtyDaysAgoForBackfill.getDate() - 30);

                const { data: recentJobsData, error: recentJobsError } = await supabase
                    .from('jobs')
                    .select('*')
                    .gte('created_at', thirtyDaysAgoForBackfill.toISOString());

                let validRecentJobs = [];
                if (!recentJobsError && recentJobsData) {
                    const newJobsUrls = new Set(newJobs.map(j => j.url));
                    validRecentJobs = recentJobsData.filter(j => !newJobsUrls.has(j.url));
                } else if (recentJobsError) {
                    console.error('Erro ao buscar vagas antigas:', recentJobsError);
                }

                function filterJobsForSubscriber(jobsToFilter, sub) {
                    return jobsToFilter.filter(job => {
                        // 1. Remoto
                        if (job.work_mode === 'remote') {
                            return sub.accept_remote || sub.only_remote;
                        }
                        
                        // Se não é remoto e o usuário só quer remoto, rejeita
                        if (sub.only_remote) return false;

                        // 2. Híbrido
                        if (job.work_mode === 'hybrid') {
                            if (sub.accepts_hybrid === false) return false;
                            
                            // "Aceitar híbrido só faria sentido na cidade da pessoa"
                            if (!sub.city) return false;
                            const subCityLower = sub.city.split(',')[0].trim().toLowerCase();
                            const jobLocLower = job.location.toLowerCase();
                            return jobLocLower.includes(subCityLower);
                        }

                        // 3. Regra Geográfica para Presencial
                        if (sub.accept_other_cities) return true;
                        
                        if (!sub.city) return false;
                        const subCityLower = sub.city.split(',')[0].trim().toLowerCase();
                        const jobLocLower = job.location.toLowerCase();
                        return jobLocLower.includes(subCityLower);
                    });
                }

                let emailsSentToday = 0;
                for (const sub of subscribers) {
                    // Se o usuário foi criado nas últimas 48h, entregamos as vagas que ele perdeu
                    const isNewUser = (Date.now() - new Date(sub.created_at).getTime()) < (48 * 60 * 60 * 1000);
                    let primaryJobs = [...newJobs];

                    if (isNewUser && validRecentJobs.length > 0) {
                        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
                        const missedJobs = validRecentJobs.filter(j => new Date(j.created_at) >= fortyEightHoursAgo);
                        primaryJobs = [...primaryJobs, ...missedJobs];
                    }
                    
                    // Remove duplicadas no array caso houver (se o banco retornar a mesma vaga)
                    const uniquePrimary = [];
                    const seenUrls = new Set();
                    for (const job of primaryJobs) {
                        if (!seenUrls.has(job.url)) {
                            seenUrls.add(job.url);
                            uniquePrimary.push(job);
                        }
                    }

                    const filteredPrimaryJobs = filterJobsForSubscriber(uniquePrimary, sub);
                    const filteredRecentJobsAll = filterJobsForSubscriber(validRecentJobs, sub);
                    
                    // Minimum Payload Logic (Backfill up to 7 jobs)
                    const TARGET_PAYLOAD = 7;
                    let filteredRecentJobs = [];
                    
                    if (filteredPrimaryJobs.length < TARGET_PAYLOAD && filteredRecentJobsAll.length > 0) {
                        const needed = TARGET_PAYLOAD - filteredPrimaryJobs.length;
                        const shuffled = [...filteredRecentJobsAll].sort(() => 0.5 - Math.random());
                        filteredRecentJobs = shuffled.slice(0, needed);
                    }
                    
                    if (filteredPrimaryJobs.length > 0) {
                        try {
                            await sendDailyEmail(sub, filteredPrimaryJobs, filteredRecentJobs, false);
                            emailsSentToday++;
                        } catch (err) {
                            console.error(`Falha ao enviar e-mail para ${sub.email}:`, err);
                        }
                    } else if (filteredRecentJobs.length > 0) {
                        // Digest Mode: Usuário não recebeu nada novo, então mandamos um boletim das recentes
                        try {
                            await sendDailyEmail(sub, filteredRecentJobs, [], true);
                            emailsSentToday++;
                        } catch (err) {
                            console.error(`Falha ao enviar e-mail (Boletim) para ${sub.email}:`, err);
                        }
                    }
                }

                // Atualiza métricas globais no Supabase
                if (newJobs.length > 0 || emailsSentToday > 0) {
                    const { error: statsError } = await supabase.rpc('increment_platform_stats', { 
                        jobs_added: newJobs.length, 
                        emails_added: emailsSentToday 
                    });
                    if (statsError) {
                        console.error('Erro ao atualizar estatísticas da plataforma:', statsError);
                    } else {
                        console.log(`Métricas atualizadas: +${newJobs.length} vagas, +${emailsSentToday} e-mails.`);
                    }
                }
            } else {
                console.log('Nenhum inscrito ativo encontrado.');
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
