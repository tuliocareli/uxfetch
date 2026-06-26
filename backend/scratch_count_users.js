const supabase = require('./utils/supabase');
require('dotenv').config();

async function countUsers() {
    const { count, error } = await supabase
        .from('subscribers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
        
    console.log(`Total de usuários ativos: ${count}`);
}

countUsers();
