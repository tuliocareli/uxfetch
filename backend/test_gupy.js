const axios = require('axios');

async function testGupyAPI() {
    try {
        console.log('Consultando a verdadeira API da Gupy...');
        const url = 'https://employability-portal.gupy.io/api/v1/jobs?jobName=ux&limit=10&offset=0';
        const { data } = await axios.get(url, {
            headers: {
                'Accept': 'application/json',
                // Sem user-agent para evitar Cloudflare WAF block
            }
        });
        
        if (data && data.data) {
            console.log(`Sucesso! Foram encontradas ${data.data.length} vagas.`);
            console.log('Primeira vaga:', JSON.stringify(data.data[0], null, 2));
        } else {
            console.log('Resposta inesperada:', data);
        }
    } catch (e) {
        console.error('Erro:', e.message);
    }
}

testGupyAPI();
