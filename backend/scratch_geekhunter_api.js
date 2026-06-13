const axios = require('axios');
const fs = require('fs');

async function testGeekHunter() {
    try {
        const response = await axios.get('https://www.geekhunter.com.br/vagas?q=ux', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });

        const html = response.data;
        fs.writeFileSync('geekhunter_test.html', html);
        
        // Let's try to extract job links or titles with regex
        const matches = html.match(/href="\/[^"]*\/jobs\/[^"]+"/g);
        if (matches) {
            console.log('Links encontrados:');
            const uniqueLinks = [...new Set(matches)];
            console.log(uniqueLinks.slice(0, 5));
        } else {
            console.log('Nenhum link de vaga encontrado com regex simples.');
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

testGeekHunter();
