const axios = require('axios');

async function scrape(browser, openai) {
    console.log('[Ilegra] Iniciando scraping via Recru API...');
    const jobs = [];
    const includeRegex = /\b(ux\b|ui\b|product\s+design(er)?|design\s+de\s+produto(s)?|designer\s+de\s+produto(s)?|design\s+ops|designops|staff\s+design(er)?|design\s+engineer|ux\s+research(er)?|design\s+research(er)?|user\s+experience|user\s+interface|service\s+design(er)?|lead\s+design(er)?|head\s+de\s+design|design\s+manager|diretor\s+de\s+design|graphic\s+design(er)?|design(er)?\s+gr[aá]fico|visual\s+design(er)?|motion\s+design(er)?|motion\s+graphics|3d\s+design(er)?|ilustrador(a)?|ux\s+writer|designer\b|videomaker|editor(a)?\s+de\s+v[ií]deo|audiovisual|edi[çc][ãa]o\s+de\s+v[ií]deo)/i;

    try {
        let page = 0;
        let hasMore = true;

        while (hasMore) {
            const url = `https://recru-backend.hub.ilegra.com/vacancies?page=${page}&size=50`;
            const response = await axios.get(url);
            const content = response.data.content || [];

            if (content.length === 0) {
                hasMore = false;
                break;
            }

            for (const item of content) {
                const title = item.title || '';
                
                // Filtro apenas vagas de UX/Design
                if (!includeRegex.test(title)) {
                    continue;
                }

                const id = item.id;
                const link = `https://vagas.ilegra.com/vacancy/${id}`;
                
                // Processar Localização e Modo de Trabalho via tags
                let location = 'Brasil';
                let workMode = item.workModel || item.vacancyType || 'Híbrido/Presencial';
                
                if (item.tags && Array.isArray(item.tags)) {
                    const locations = item.tags.filter(t => t.order === 1).map(t => t.name);
                    if (locations.length > 0) location = locations[0];
                    
                    const modes = item.tags.filter(t => t.name.toLowerCase().includes('remoto') || t.name.toLowerCase().includes('híbrido')).map(t => t.name);
                    if (modes.length > 0) workMode = modes[0];
                }

                let description = 'Vaga de Design/UX na Ilegra encontrada pelo UX Fetch.';

                // Tentar gerar um resumo rápido usando a OpenAI, mas na falta de descrição completa, 
                // vamos só inferir que é uma vaga compatível
                try {
                    const prompt = `Crie um resumo atrativo em PT-BR para uma vaga de ${title} na Ilegra. A vaga é ${workMode} em ${location}. Seja breve (max 3 linhas).`;
                    const chatCompletion = await openai.chat.completions.create({
                        messages: [{ role: 'user', content: prompt }],
                        model: 'gpt-3.5-turbo',
                        max_tokens: 150
                    });
                    description = chatCompletion.choices[0].message.content.trim();
                } catch (e) {
                    console.log(`[Ilegra] Erro ao gerar resumo para ${title}: ${e.message}`);
                }

                jobs.push({
                    company: 'Ilegra',
                    title: title,
                    location: location,
                    workMode: workMode.includes('Remoto') ? 'Remoto' : workMode,
                    url: link,
                    description: description,
                    date: new Date().toISOString()
                });
            }

            // A API parece retornar menos de 50 vagas no total na ilegra, mas caso haja mais
            if (content.length < 50) {
                hasMore = false;
            } else {
                page++;
            }
        }

        console.log(`[Ilegra] Sucesso! Foram formatadas ${jobs.length} vagas de UX/UI exclusivas.`);
    } catch (error) {
        console.error(`[Ilegra] Erro fatal no scraping da Ilegra:`, error.message);
    }

    return jobs;
}

module.exports = { scrape };
