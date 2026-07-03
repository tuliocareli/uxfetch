const supabase = require('./utils/supabase');
require('dotenv').config();

async function run() {
    const email = 'luan.n.v@hotmail.com';
    console.log(`Inativando usuário: ${email}...`);

    const { data, error } = await supabase
        .from('subscribers')
        .update({ is_active: false })
        .eq('email', email)
        .select();

    if (error) {
        console.error('Erro ao atualizar usuário:', error);
    } else {
        console.log('Usuário inativado com sucesso!', data);
    }
}

run();
