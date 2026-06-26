const supabase = require('./utils/supabase');
require('dotenv').config();

async function checkUser() {
    const { data, error } = await supabase
        .from('subscribers')
        .select('email, preferred_roles, preferred_seniorities')
        .eq('email', 'tctulio2009@gmail.com')
        .single();
        
    if (error) {
        console.error('Erro:', error);
    } else {
        console.log('Dados do usuário atualizados no banco:', data);
    }
}

checkUser();
