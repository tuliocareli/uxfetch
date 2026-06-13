require('dotenv').config();
const supabase = require('./utils/supabase');

async function run() {
    const { data, error } = await supabase.from('jobs').select('*').limit(1);
    console.log('Sample job row:', data ? data[0] : null);
}
run();
