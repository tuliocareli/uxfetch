const axios = require('axios');

async function test() {
    const url = 'https://apigw.solides.com.br/jobs/v3/portal-vacancies-new?title=designer&take=20&page=1';
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        console.log('Raw Data:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('API Error:', e.message);
    }
}

test().catch(console.error);
