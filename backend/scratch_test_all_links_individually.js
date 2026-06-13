const axios = require('axios');
const cheerio = require('cheerio');

const urls = [
    "https://vagas.solides.com.br/vagas/todos/product-designer-pl?id=QXfVHgTIlM",
    "https://vagas.solides.com.br/vaga/862643/product-designer---joinville",
    "https://vagas.solides.com.br/vaga/860953/product-designer---ai-first",
    "https://vagas.solides.com.br/vaga/856924/product-designer-uiux-plsr",
    "https://vagas.solides.com.br/vaga/846419/product-designer-uxui",
    "https://vagas.solides.com.br/vaga/840059/product-designer",
    "https://vagas.solides.com.br/vaga/810261/product-designer-pleno-presencial",
    "https://vagas.solides.com.br/vaga/769144/product-designer-pleno",
    "https://vagas.solides.com.br/vaga/748949/product-design-senior",
    "https://vagas.solides.com.br/vaga/855835/designer-uxui-senior"
];

async function checkUrl(url) {
    console.log(`\nChecking URL: ${url}`);
    try {
        const res = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(res.data);
        const nextDataJson = $('#__NEXT_DATA__').html();
        if (!nextDataJson) {
            console.log(`  ❌ Error: __NEXT_DATA__ not found`);
            return;
        }
        const data = JSON.parse(nextDataJson);
        const vacancy = data.props?.pageProps?.vacancy;
        if (!vacancy) {
            console.log(`  ❌ Error: No vacancy object in NextJS props`);
            return;
        }

        console.log(`  ✅ Success: "${vacancy.title}" at "${vacancy.companyName}"`);
        console.log(`     jobsActivated: ${vacancy.jobsActivated}`);
        console.log(`     companyActivated: ${vacancy.companyActivated}`);
        console.log(`     paymentUpToDate: ${vacancy.paymentUpToDate}`);
        console.log(`     isDisabled: ${vacancy.isDisabled}`);
        console.log(`     receivingResume: ${vacancy.receivingResume}`);
        console.log(`     currentState: ${vacancy.currentState}`);
    } catch (e) {
        console.log(`  ❌ Axios Request Failed: ${e.message}`);
    }
}

(async () => {
    for (const url of urls) {
        await checkUrl(url);
    }
})().catch(console.error);
