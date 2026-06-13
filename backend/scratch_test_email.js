require('dotenv').config();
const supabase = require('./utils/supabase');
const { sendDailyEmail } = require('./utils/mailer');

async function testEmail() {
    console.log('Buscando vagas no banco de dados...');
    // Busca vagas recentes misturadas (nacionais e internacionais)
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) {
        console.error('Erro:', error);
        return;
    }

    // Intercalando as vagas para o e-mail (3 nacionais para 1 internacional)
    const nationalJobs = jobs.filter(j => !j.is_international);
    const intlJobs = jobs.filter(j => j.is_international);
    
    // Forçar a primeira vaga nacional a ser híbrida para teste visual do usuário
    if (nationalJobs.length > 0) {
        nationalJobs[0].work_mode = 'hybrid';
        nationalJobs[0].location = 'Belo Horizonte/MG';
    }
    
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

    console.log(`Disparando e-mail de teste para tctulio2009@gmail.com com ${interleaved.length} vagas intercaladas...`);
    
    // O usuário de teste
    const testUser = { email: 'tctulio2009@gmail.com' };
    
    // Pegar algumas para 'vagas recentes' só para o template não quebrar
    const recentJobs = nationalJobs.slice(0, 2);

    await sendDailyEmail(testUser, interleaved, recentJobs);
    console.log('🚀 E-mail de teste enviado com sucesso!');
}

testEmail().catch(console.error);
