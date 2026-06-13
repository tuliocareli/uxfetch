require('dotenv').config();
const supabase = require('./utils/supabase');

async function listJobs() {
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, title, company, url, source')
        .eq('source', 'Sólides');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Current Sólides jobs in DB (${jobs.length}):`);
    jobs.forEach(j => {
        console.log(`- "${j.title}" | URL: ${j.url}`);
    });
}

listJobs().catch(console.error);
