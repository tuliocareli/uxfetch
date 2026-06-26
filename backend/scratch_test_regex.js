const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'e:/Scraper/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function categorizeJob(job) {
    const t = job.title.toLowerCase();
    const isPlusExplicit = /\b(game|cad|graphic|gr[aá]fico|visual|brand|marketing|arte|social media|motion|3d|ilustra|moda|interiores|embalagem|t[êe]xtil)\b/i.test(t);
    
    if (isPlusExplicit) return 'plus';
    
    const isUxUiProduct = /\b(ux|ui|product|produto|research|pesquisa|service|experi[êe]ncia|usabilidade|interface)\b/i.test(t);
    const isLeadership = /\b(lead|head|staff|principal|manager|diretor|coordinator)\b/i.test(t);
    
    if (isUxUiProduct || isLeadership) return 'core';
    
    return 'plus';
}

async function test() {
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('title')
        .order('created_at', { ascending: false })
        .limit(100);

    let coreCount = 0;
    let plusCount = 0;

    jobs.forEach(j => {
        const cat = categorizeJob(j);
        if (cat === 'core') coreCount++;
        else plusCount++;
        console.log(`[${cat.toUpperCase()}] ${j.title}`);
    });

    console.log(`\nCore: ${coreCount} | Plus: ${plusCount}`);
}

test();
