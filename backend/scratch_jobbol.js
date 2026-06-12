const axios = require('axios');

async function testVagas() {
    try {
        const { data } = await axios.get('https://www.vagas.com.br/vagas-de-ux-design', {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        console.log('Vagas.com.br status 200, length:', data.length);
    } catch(e) {
        console.error('Vagas.com.br Failed:', e.message);
    }
}
testVagas();
