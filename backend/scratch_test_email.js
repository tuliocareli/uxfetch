require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { sendDailyEmail } = require('./utils/mailer');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function sendTestEmail() {
    console.log("Iniciando envio de e-mail de teste...");
    
    // 1. Buscar o usuário
    const targetEmail = 'tctulio2009@gmail.com';
    let { data: user, error: userError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', targetEmail)
        .single();
        
    if (userError || !user) {
        console.log("Usuário não encontrado na base. Criando usuário mock para o teste...");
        user = {
            email: targetEmail,
            token: '00000000-0000-0000-0000-000000000000',
            state: '',
            city: '',
            work_modes: ['remote', 'hybrid', 'in_person']
        };
    } else {
        console.log(`Usuário encontrado! Token de segurança: ${user.token}`);
    }

    // 2. Pegar algumas vagas para colocar no e-mail
    const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
        
    if (jobsError || !jobs || jobs.length === 0) {
        console.error("Erro ao buscar vagas ou banco vazio:", jobsError);
        return;
    }
    
    // Dividir em "novas" e "recentes" simulando o scraper
    const newJobs = jobs.slice(0, 4);
    const recentJobs = jobs.slice(4, 8);
    
    console.log(`Montando e-mail com ${newJobs.length} vagas novas e ${recentJobs.length} recentes.`);

    // 3. Disparar e-mail
    try {
        await sendDailyEmail(user, newJobs, recentJobs);
        console.log("E-mail de teste disparado com sucesso! Verifique a caixa de entrada (e o Spam, por garantia).");
    } catch (e) {
        console.error("Falha ao enviar:", e);
    }
}

sendTestEmail();
