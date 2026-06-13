require('dotenv').config();
const supabase = require('./utils/supabase');

async function checkSources() {
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, source, url, title');

    if (error) {
        console.error(error);
        return;
    }

    const counts = {};
    jobs.forEach(j => {
        counts[j.source] = (counts[j.source] || 0) + 1;
    });
    console.log('Total jobs by source:', counts);
    
    // Also, let's print any Sólides URL that doesn't start with https://vagas.solides.com.br/vaga/
    const invalidSolides = jobs.filter(j => j.source === 'Sólides' && !j.url.startsWith('https://vagas.solides.com.br/vaga/'));
    console.log('Sólides jobs with non-vaga URL:', invalidSolides);
}

checkSources().catch(console.error);
