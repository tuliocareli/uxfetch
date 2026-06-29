const supabase = require('./utils/supabase');
require('dotenv').config();

async function checkSub() {
    const { data: subscribers, error: subError } = await supabase
        .from('subscribers')
        .select('*')
        .eq('email', 'tctulio2009@gmail.com');
    console.log(subscribers[0]);
}
checkSub();
