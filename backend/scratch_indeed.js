const axios = require('axios');

async function testIndeed() {
    console.log('Testando a viabilidade do Indeed...');
    try {
        const { status, data } = await axios.get('https://br.indeed.com/jobs?q=ux+designer', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            timeout: 10000
        });
        console.log(`Status: ${status}`);
        if (data.includes('cloudflare') || data.includes('captcha') || data.includes('hCaptcha')) {
            console.log('Indeed Detectou: Proteção Anti-bot Ativada (Cloudflare/Captcha)');
        } else {
            console.log('HTML retornado com sucesso. Verificando vagas...');
            if (data.includes('jobsearch-ResultsList') || data.includes('job_seen_beacon')) {
                console.log('Vagas encontradas no HTML!');
            } else {
                console.log('Sem vagas no HTML, possível SSR bloqueado.');
            }
        }
    } catch(e) {
        console.log(`Indeed Erro: ${e.message}`);
    }
}
testIndeed();
