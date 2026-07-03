require('dotenv').config();
const { sendDailyEmail } = require('./utils/mailer');
const supabase = require('./utils/supabase');

async function testRealDigest() {
    console.log('Iniciando disparo real para tctulio2009@gmail.com...');
    
    // Obter dados reais de vagas antigas (recentes) do banco
    const { data: recentJobsData, error: recentJobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3); // Pega as últimas 3 vagas para simular o digest

    if (recentJobsError) {
        console.error('Erro ao buscar vagas do banco:', recentJobsError);
        return;
    }

    const testUser = {
        email: 'tctulio2009@gmail.com',
        token: 'test-token-12345',
        isWeeklyDigest: false
    };

    // sendDailyEmail(user, jobs, recentJobs = [], isDigestMode = false)
    await sendDailyEmail(testUser, recentJobsData, [], true);
    
    console.log('Finalizado.');
}

testRealDigest();
