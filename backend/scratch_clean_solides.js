require('dotenv').config();
const supabase = require('./utils/supabase');

async function clean() {
    console.log('Cleaning up invalid Sólides jobs from DB...');

    // 1. Delete old format URL job
    const { data: d1, error: e1 } = await supabase
        .from('jobs')
        .delete()
        .eq('id', '71f38542-c440-495b-8ad4-99ccca17c87b');
    
    if (e1) console.error('Error deleting job 1:', e1);
    else console.log('Successfully deleted old format URL job.');

    // 2. Delete job 855835 which returns 500
    const { data: d2, error: e2 } = await supabase
        .from('jobs')
        .delete()
        .eq('url', 'https://vagas.solides.com.br/vaga/855835/designer-uxui-senior');

    if (e2) console.error('Error deleting job 2:', e2);
    else console.log('Successfully deleted 500 error job.');
}

clean().catch(console.error);
