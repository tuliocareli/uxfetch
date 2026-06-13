require('dotenv').config();
const supabase = require('./utils/supabase');
const axios = require('axios');
const cheerio = require('cheerio');

async function checkAll() {
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('id, url, title')
        .eq('source', 'Sólides');

    if (error) {
        console.error(error);
        return;
    }

    console.log(`Checking ${jobs.length} Sólides jobs:`);
    for (const job of jobs) {
        try {
            const res = await axios.get(job.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(res.data);
            const pageTitle = $('title').text();
            const bodyText = $('body').text().toLowerCase();
            const hasExpirationMessage = bodyText.includes('não encontrada') || bodyText.includes('não existe') || bodyText.includes('expirou') || bodyText.includes('processo encerrado');

            console.log(`- Title: "${job.title}"`);
            console.log(`  URL: ${job.url}`);
            console.log(`  HTTP Status: ${res.status}`);
            console.log(`  HTML Title: "${pageTitle}"`);
            console.log(`  Has Expired/Error Message: ${hasExpirationMessage ? '❌ YES' : '✅ NO'}`);
            if (hasExpirationMessage) {
                console.log(`  Snippet: ${$('body').text().substring(0, 300).replace(/\s+/g, ' ')}`);
            }
        } catch (err) {
            console.log(`- Title: "${job.title}" | URL: ${job.url} | ❌ Fetch Error: ${err.message}`);
        }
        console.log('------------------------------------');
    }
}

checkAll().catch(console.error);
