require('dotenv').config();
const supabase = require('./utils/supabase');

async function run() {
    const { data, error } = await supabase.from('subscribers').select('*').limit(1);
    console.log('Sample subscriber row:', data ? data[0] : null);
}
run();
