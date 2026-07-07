require('dotenv').config();
const { sendDailyEmail } = require('./utils/mailer');
const supabase = require('./utils/supabase');

async function sendTestEmail() {
    const emailToTest = 'tctulio2009@gmail.com';
    console.log(`Buscando dados reais do usuário ${emailToTest}...`);

    // Busca o usuário para ter o token real
    const { data: user, error: userError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', emailToTest)
        .maybeSingle();

    if (userError) {
        console.error('Erro ao buscar usuário:', userError);
        return;
    }

    let userObj = user;
    if (!userObj) {
        console.log('Usuário não encontrado no banco. Enviando com token de teste.');
        userObj = {
            email: emailToTest,
            token: 'test-token-0000-0000-0000'
        };
    } else {
        console.log('Usuário encontrado. Token real será usado.');
    }

    // Obter algumas vagas reais do banco
    const { data: recentJobsData, error: recentJobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2);

    if (recentJobsError) {
        console.error('Erro ao buscar vagas do banco:', recentJobsError);
        return;
    }

    console.log('Disparando e-mail usando o template atualizado (FALHA 7 corrigida, com token)...');
    
    // sendDailyEmail(user, jobs, recentJobs = [], isDigestMode = false)
    await sendDailyEmail(userObj, recentJobsData, [], false);
    
    console.log('Disparo de teste finalizado com sucesso!');
}

sendTestEmail();
