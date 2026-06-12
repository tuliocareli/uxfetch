const axios = require('axios');
async function test() {
    try {
        const ghData = await axios.get('https://api.geekhunter.com.br/api/v1/jobs', {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            validateStatus: false
        });
        console.log('Geekhunter:', ghData.data);
    } catch(e) {}
}
test();
