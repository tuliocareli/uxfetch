const axios = require('axios');

async function scrapeJS() {
    try {
        const jsUrls = [
            'https://cdn.coodesh.com/assets/js/_next/static/chunks/dc321e75a0ccb325.js',
            'https://cdn.coodesh.com/assets/js/_next/static/chunks/a5a56ea27434c1fb.js',
            'https://cdn.coodesh.com/assets/js/_next/static/chunks/ee43a2d424d2ddf6.js'
        ]; // Just picking a few randomly or I could just search all of them if I had the time.
        
        console.log("Since I cannot easily load 100 JS files here, let's just do a simpler search...");
        
        const res = await axios.get('https://coodesh.com/vagas');
        const buildIdMatch = res.data.match(/"buildId":"([^"]+)"/);
        if (buildIdMatch) {
            console.log('NextJS Build ID:', buildIdMatch[1]);
            // In NextJS, we can fetch data directly via _next/data/BUILD_ID/vagas.json
            const nextDataUrl = `https://coodesh.com/_next/data/${buildIdMatch[1]}/vagas.json`;
            console.log('Trying NextJS data endpoint:', nextDataUrl);
            const { data: nextData } = await axios.get(nextDataUrl, { validateStatus: false });
            console.log('Status:', nextData ? 'Found' : 'Not found');
            if (nextData && nextData.pageProps) {
                console.log('Keys in pageProps:', Object.keys(nextData.pageProps));
            }
        }
    } catch(e) {
        console.error(e.message);
    }
}
scrapeJS();
