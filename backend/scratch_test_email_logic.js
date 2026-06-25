require('dotenv').config();
const supabase = require('./utils/supabase');
const { sendDailyEmail } = require('./utils/mailer');

async function testEmail() {
    console.log('Iniciando teste de e-mail com a nova lógica (Minimum Payload de 7 vagas)...');

    const targetEmail = 'tctulio2009@gmail.com';

    // 1. Buscar o usuário
    const { data: subscribers, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', targetEmail)
        .limit(1);

    if (subError || !subscribers || subscribers.length === 0) {
        console.error('Usuário não encontrado ou erro:', subError);
        return;
    }

    const sub = subscribers[0];
    console.log(`Usuário encontrado: ${sub.email} (Aceita Remoto: ${sub.accept_remote}, Cidade: ${sub.city})`);

    // 2. Buscar vagas novas (simulando que não há nenhuma inédita hoje para acionar o backfill máximo)
    const newJobs = [];

    // 3. Buscar vagas antigas (últimos 30 dias) para preenchimento de cota (backfill)
    const thirtyDaysAgoForBackfill = new Date();
    thirtyDaysAgoForBackfill.setDate(thirtyDaysAgoForBackfill.getDate() - 30);

    const { data: recentJobsData, error: recentJobsError } = await supabase
        .from('jobs')
        .select('*')
        .gte('created_at', thirtyDaysAgoForBackfill.toISOString());

    if (recentJobsError) {
        console.error('Erro ao buscar vagas antigas:', recentJobsError);
        return;
    }

    const validRecentJobs = recentJobsData || [];
    console.log(`Total de vagas ativas no banco (últimos 30 dias): ${validRecentJobs.length}`);

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

    let primaryJobs = [...newJobs];

    // Simulação: Se for novo usuário (criado nas últimas 48h)
    const isNewUser = (Date.now() - new Date(sub.created_at).getTime()) < (48 * 60 * 60 * 1000);
    if (isNewUser && validRecentJobs.length > 0) {
        const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const missedJobs = validRecentJobs.filter(j => new Date(j.created_at) >= fortyEightHoursAgo);
        primaryJobs = [...primaryJobs, ...missedJobs];
    }

    // Remove duplicadas no array caso houver
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
    
    console.log(`Vagas Primárias Filtradas (Inéditas/48h): ${filteredPrimaryJobs.length}`);
    console.log(`Vagas Antigas Filtradas para o perfil: ${filteredRecentJobsAll.length}`);

    // Minimum Payload Logic
    const TARGET_PAYLOAD = 7;
    let filteredRecentJobs = [];
    
    if (filteredPrimaryJobs.length < TARGET_PAYLOAD && filteredRecentJobsAll.length > 0) {
        const needed = TARGET_PAYLOAD - filteredPrimaryJobs.length;
        const shuffled = [...filteredRecentJobsAll].sort(() => 0.5 - Math.random());
        filteredRecentJobs = shuffled.slice(0, needed);
    }

    console.log(`Backfill (Vagas selecionadas para preencher): ${filteredRecentJobs.length}`);

    if (filteredPrimaryJobs.length > 0) {
        try {
            console.log('Enviando e-mail normal (Primary + Backfill)...');
            await sendDailyEmail(sub, filteredPrimaryJobs, filteredRecentJobs, false);
        } catch (err) {
            console.error(`Falha ao enviar e-mail:`, err);
        }
    } else if (filteredRecentJobs.length > 0) {
        try {
            console.log('Enviando e-mail em formato DIGEST (Somente Backfill)...');
            await sendDailyEmail(sub, filteredRecentJobs, [], true);
        } catch (err) {
            console.error(`Falha ao enviar e-mail:`, err);
        }
    } else {
        console.log('Nenhuma vaga combinou com o perfil deste usuário.');
    }
}

testEmail();
