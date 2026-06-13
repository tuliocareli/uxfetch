const axios = require('axios');
const cheerio = require('cheerio');

async function checkVacancy(id, slug) {
    const url = `https://vagas.solides.com.br/vaga/${id}/${slug}`;
    console.log(`\n=======================================\nChecking URL: ${url}\n=======================================`);
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(res.data);
        const nextDataJson = $('#__NEXT_DATA__').html();
        if (!nextDataJson) {
            console.log('__NEXT_DATA__ script tag not found!');
            return;
        }

        const data = JSON.parse(nextDataJson);
        if (data.props && data.props.pageProps && data.props.pageProps.vacancy) {
            const v = data.props.pageProps.vacancy;
            console.log('  id:', v.id);
            console.log('  title:', v.title);
            console.log('  companyName:', v.companyName);
            console.log('  jobsActivated:', v.jobsActivated);
            console.log('  companyActivated:', v.companyActivated);
            console.log('  paymentUpToDate:', v.paymentUpToDate);
            console.log('  isDisabled:', v.isDisabled);
            console.log('  receivingResume:', v.receivingResume);
            console.log('  currentState:', v.currentState);
        } else {
            console.log('No vacancy data in page props');
        }
    } catch (err) {
        console.error('Error fetching/parsing:', err.message);
    }
}

(async () => {
    // 862643 (active/working) vs 860953 (blank/inactive)
    await checkVacancy(862643, 'product-designer---joinville');
    await checkVacancy(860953, 'product-designer---ai-first');
})().catch(console.error);
