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
        { name: 'Inhire', run: inhireScraper }
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
                        const filteredNewJobs = filterJobsForSubscriber(newJobs, sub);
                        const filteredRecentJobs = filterJobsForSubscriber(recentJobs, sub);
                        
                        // Envia apenas se tiver vaga nova para a pessoa
                        if (filteredNewJobs.length > 0) {
                            try {
                                await sendDailyEmail(sub, filteredNewJobs, filteredRecentJobs);
                                emailsSentToday++;
                            } catch (err) {
                                console.error(`Falha ao enviar e-mail para ${sub.email}:`, err);
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
