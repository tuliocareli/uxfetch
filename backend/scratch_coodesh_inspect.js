const axios = require('axios');
const cheerio = require('cheerio');

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
};

async function testCoodesh() {
    try {
        const { data } = await axios.get('https://coodesh.com/vagas', { headers });
        const $ = cheerio.load(data);
        console.log('Title:', $('title').text());
        
        // Let's print out script tags to see if __NEXT_DATA__ is there
        const hasNextData = $('#__NEXT_DATA__').length > 0;
        console.log('NextJS __NEXT_DATA__ found:', hasNextData);
        if (hasNextData) {
            const nextDataJson = $('#__NEXT_DATA__').html();
            console.log('__NEXT_DATA__ Length:', nextDataJson.length);
            const dataObj = JSON.parse(nextDataJson);
            console.log('Props keys:', Object.keys(dataObj.props || {}));
            if (dataObj.props?.pageProps) {
                console.log('pageProps keys:', Object.keys(dataObj.props.pageProps));
                // If there are job listings in pageProps, print them!
                const keys = Object.keys(dataObj.props.pageProps);
                for (const k of keys) {
                    const val = dataObj.props.pageProps[k];
                    if (val && Array.isArray(val)) {
                        console.log(`  Found Array key "${k}" with ${val.length} items`);
                        if (val.length > 0) {
                            console.log(`  First item keys:`, Object.keys(val[0]));
                        }
                    } else if (val && typeof val === 'object') {
                        console.log(`  Found Object key "${k}" (keys: ${Object.keys(val)})`);
                    }
                }
            }
        } else {
            console.log('Let\'s search for script tags containing NUXT or others:');
            $('script').each((i, el) => {
                const html = $(el).html() || '';
                if (html.includes('__NUXT__') || html.includes('INITIAL_STATE')) {
                    console.log(`Found Nuxt/State script! Length: ${html.length}`);
                    console.log(html.substring(0, 500));
                }
            });
        }
        
        // Search for job card anchors
        const anchors = $('a[href*="/vaga/"], a[href*="/vagas/"]');
        console.log('Anchors found:', anchors.length);
        anchors.slice(0, 10).each((i, el) => {
            console.log(`  Link ${i}: href="${$(el).attr('href')}" text: "${$(el).text().trim().substring(0, 50)}"`);
        });

    } catch (e) {
        console.error(e.message);
    }
}

testCoodesh();
