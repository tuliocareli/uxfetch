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
        // Valida campos obrigatórios do banco para evitar falha em cascata no Upsert
        const cleanJobs = allJobs.map(j => {
            const { needsDeepCheck, ...cleanJob } = j;
            return cleanJob;
        }).filter(j => j.url && j.title && j.company && j.location && j.source && typeof j.is_remote === 'boolean');

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
                // FREQUÊNCIA INTELIGENTE (SUNSET POLICY)
                const todayDayOfWeek = new Date().getDay(); // 0 = Domingo, 5 = Sexta
                const ENGAGEMENT_WEEKLY_DAYS = 15;
                const ENGAGEMENT_SUNSET_DAYS = 60;
                
                const activeSubscribers = [];
                const sunsetUsers = [];
                
                for (const sub of subscribers) {
                    const baseDate = sub.last_opened_at || sub.created_at;
                    const daysSinceLastInteraction = (Date.now() - new Date(baseDate).getTime()) / (1000 * 60 * 60 * 24);
                    
                    if (daysSinceLastInteraction > ENGAGEMENT_SUNSET_DAYS) {
                        sunsetUsers.push(sub.email);
                        continue;
                    }
                    
                    if (daysSinceLastInteraction <= ENGAGEMENT_WEEKLY_DAYS) {
                        // Usuário engajado
                        activeSubscribers.push(sub);
                    } else {
                        // Usuário "frio", recebe só na sexta-feira
                        if (todayDayOfWeek === 5) {
                            sub.isWeeklyDigest = true; // Flag para o mailer adicionar a mensagem de reengajamento
                            activeSubscribers.push(sub);
                        }
                    }
                }
                
                // Aplica o Sunset assincronamente
                if (sunsetUsers.length > 0) {
                    console.log(`Aplicando Sunset Policy: ${sunsetUsers.length} usuários inativos há mais de ${ENGAGEMENT_SUNSET_DAYS} dias serão desativados.`);
                    supabase.from('subscribers')
                        .update({ is_active: false })
                        .in('email', sunsetUsers)
                        .then(({error}) => {
                            if (error) console.error('Erro no Sunset Policy:', error);
                            else console.log('Sunset Policy aplicado no banco.');
                        });
                }

                if (activeSubscribers.length === 0) {
                    console.log('Nenhum inscrito engajado ou elegível na régua semanal para receber hoje.');
                    return;
                }

                console.log(`Preparando disparo de e-mails para ${activeSubscribers.length} inscrito(s) engajados hoje (de ${subscribers.length} ativos totais)...`);
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
                    // 0. Prepara preferências (com defaults)
                    const prefRoles = (sub.preferred_roles && sub.preferred_roles.length > 0) 
                        ? sub.preferred_roles 
                        : ['ux_ui', 'leadership']; // Default: só produto e ux/liderança
                    
                    const prefSen = (sub.preferred_seniorities && sub.preferred_seniorities.length > 0)
                        ? sub.preferred_seniorities
                        : ['junior', 'pleno', 'senior', 'especialista']; // Default: todas

                    return jobsToFilter.filter(job => {
                        const t = job.title.toLowerCase();
                        
                        // --- A. FILTRO DE ÁREA (ROLE) STRICT MODE ---
                        const isVideoMotion = /\b(videos?|v[ií]deos?|videomaker|filmmaker|audiovisual|edi[çc][ãa]o|motion|3d|after effects|premiere|anima[çc][ãa]o|animador|animadora|vfx|capcut|cinema|cinegrafista|fotografia|fot[óo]grafo|c4d|blender|maya|zbrush|render)\b/i.test(t);
                        const isPlusExplicit = /\b(game|cad|graphic|gr[aá]fico|visual|brand|marketing|arte|social media|ilustra|moda|interiores|embalagem|t[êe]xtil|criativo|criativos|comunica[çc][ãa]o|publicidade|digital)\b/i.test(t) || isVideoMotion;
                        const isLeadership = /\b(lead|head|staff|principal|manager|diretor|coordinator)\b/i.test(t);
                        
                        const isUxUiProduct = /\b(ux|ui|product|produto|research|pesquisa|service|experi[êe]ncia|usabilidade|interface)\b/i.test(t);
                        
                        // Garante que vagas de video/motion NUNCA caiam como UX/UI, mesmo que contenham "produto"
                        const isUxUi = isUxUiProduct && !isVideoMotion;

                        const isGraphicExplicit = /\b(graphic|gr[aá]fico|visual|brand|marketing|arte|social media|criativo|criativos|comunica[çc][ãa]o|publicidade|digital)\b/i.test(t);
                        // Graphic é o fallback genérico, mas exclui explicitamente video/motion e ux/ui
                        const isGraphic = (isGraphicExplicit || (!isPlusExplicit && !isLeadership && !isUxUiProduct)) && !isVideoMotion && !isUxUiProduct;
                        
                        // Others passa a englobar explicitamente Video e Motion
                        const isOthers = /\b(ilustra|game|cad|moda|interiores|embalagem|t[êe]xtil)\b/i.test(t) || isVideoMotion;

                        let roleMatch = false;
                        if (prefRoles.includes('leadership') && isLeadership) roleMatch = true;
                        if (prefRoles.includes('graphic') && isGraphic) roleMatch = true;
                        if (prefRoles.includes('others') && isOthers) roleMatch = true;
                        if (prefRoles.includes('ux_ui') && isUxUi) roleMatch = true;
                        
                        if (!roleMatch) return false;

                        // --- B. FILTRO DE SENIORIDADE ---
                        const isJunior = /\b(est[áa]gio|trainee|j[úu]nior|junior|jr\.?)\b/i.test(t);
                        const isPleno = /\b(pleno|pl\.?|mid[\s-]?level)\b/i.test(t);
                        const isEspecialista = /\b(lead|head|staff|principal|especialista|manager|diretor)\b/i.test(t);
                        const isSenior = /\b(s[êe]nior|senior|sr\.?)\b/i.test(t);
                        const isUnspecified = !isJunior && !isPleno && !isEspecialista && !isSenior;

                        let senMatch = false;
                        if (prefSen.includes('junior') && isJunior) senMatch = true;
                        if (prefSen.includes('pleno') && (isPleno || isUnspecified)) senMatch = true;
                        if (prefSen.includes('senior') && (isSenior || isUnspecified)) senMatch = true;
                        if (prefSen.includes('especialista') && isEspecialista) senMatch = true;

                        if (!senMatch) return false;

                        // --- C. FILTRO DE FORMATO/LOCALIZAÇÃO ---
                        if (job.work_mode === 'remote') {
                            return sub.accept_remote || sub.only_remote;
                        }
                        
                        if (sub.only_remote) return false;

                        if (job.work_mode === 'hybrid') {
                            if (sub.accepts_hybrid === false) return false;
                            if (!sub.city) return false;
                            const subCityLower = sub.city.split(',')[0].trim().toLowerCase();
                            const jobLocLower = job.location.toLowerCase();
                            return jobLocLower.includes(subCityLower);
                        }

                        // Presencial
                        if (sub.accept_other_cities) return true;
                        if (!sub.city) return false;
                        const subCityLower = sub.city.split(',')[0].trim().toLowerCase();
                        const jobLocLower = job.location.toLowerCase();
                        return jobLocLower.includes(subCityLower);
                    });
                }

                let emailsSentToday = 0;
                for (const sub of activeSubscribers) {
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

    console.log('Rotina de limpeza de banco desativada para retenção histórica permanente.');

    console.log('Orquestrador finalizado.');
}

main().catch(error => {
    console.error('Fatal error in main orchestrator:', error);
    process.exit(1);
});
