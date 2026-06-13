const axios = require('axios');

async function test() {
    const activeId = 862643;
    const inactiveId = 860953;

    const endpoints = [
        id => `https://apigw.solides.com.br/jobs/v3/portal-vacancies/${id}`,
        id => `https://apigw.solides.com.br/jobs/v3/vacancies/${id}`,
        id => `https://apigw.solides.com.br/jobs/v3/portal-vacancies-new/${id}`
    ];

    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://vagas.solides.com.br'
    };

    for (const epGen of endpoints) {
        console.log(`\nTesting endpoint pattern: ${epGen('ID')}`);
        
        try {
            const res = await axios.get(epGen(activeId), { headers });
            console.log(`  Active ID (${activeId}): SUCCESS (status: ${res.status})`);
        } catch (e) {
            console.log(`  Active ID (${activeId}): FAILED (${e.message})`);
            if (e.response) {
                console.log(`    Response status: ${e.response.status}`);
                console.log(`    Response data (first 200 chars): ${JSON.stringify(e.response.data).substring(0, 200)}`);
            }
        }

        try {
            const res = await axios.get(epGen(inactiveId), { headers });
            console.log(`  Inactive ID (${inactiveId}): SUCCESS (status: ${res.status})`);
        } catch (e) {
            console.log(`  Inactive ID (${inactiveId}): FAILED (${e.message})`);
            if (e.response) {
                console.log(`    Response status: ${e.response.status}`);
                console.log(`    Response data (first 200 chars): ${JSON.stringify(e.response.data).substring(0, 200)}`);
            }
        }
    }
}

test().catch(console.error);
