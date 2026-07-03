const supabase = require('./utils/supabase');
require('dotenv').config();

async function run() {
    const emails = [
        'jessixagregorio42@gmail.com',
        'ortunhogabriel@fmail.com',
        'maarcosalves2@gmail.com'
    ];

    console.log(`Iniciando inativação de ${emails.length} emails (Hard Bounce)...`);

    const { data, error } = await supabase
        .from('subscribers')
        .update({ is_active: false })
        .in('email', emails)
        .select('email, is_active');

    if (error) {
        console.error('Erro ao atualizar usuários:', error);
    } else {
        console.log('Usuários inativados com sucesso!');
        console.log(data);
    }
}

run();
