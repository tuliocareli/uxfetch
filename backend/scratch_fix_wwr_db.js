require('dotenv').config();
const supabase = require('./utils/supabase');
const cheerio = require('cheerio');

async function fixWWRDatabase() {
    console.log('Buscando vagas do We Work Remotely no banco de dados...');
    
    // Busca todas as vagas do WWR
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('source', 'We Work Remotely');

    if (error) {
        console.error('Erro ao buscar vagas:', error);
        return;
    }

    console.log(`Encontradas ${jobs.length} vagas do We Work Remotely. Analisando tamanho da descrição...`);

    const toUpdate = [];

    for (const job of jobs) {
        // Se a descrição for muito longa, vamos truncar
        if (job.description && job.description.length > 135) {
            // Carrega com cheerio para remover qualquer possível tag HTML que tenha passado
            const plainText = cheerio.load(job.description).text().replace(/\s+/g, ' ').trim();
            const shortDesc = plainText.length > 130 ? plainText.substring(0, 130) + '...' : plainText;
            
            // Adicionamos no array de atualização
            toUpdate.push({
                ...job,
                description: shortDesc
            });
        }
    }

    if (toUpdate.length > 0) {
        console.log(`Serão corrigidas ${toUpdate.length} vagas que estavam com descrição muito longa.`);
        
        const { error: updateError } = await supabase
            .from('jobs')
            .upsert(toUpdate, { onConflict: 'url' });
        
        if (updateError) {
            console.error('Erro ao atualizar vagas no Supabase:', updateError);
        } else {
            console.log('✅ Todas as vagas do WWR com problema foram corrigidas com sucesso no banco de dados!');
        }
    } else {
        console.log('Nenhuma vaga precisava de correção (todas já estavam curtas).');
    }
}

fixWWRDatabase();
