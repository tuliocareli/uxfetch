require('dotenv').config();
const supabase = require('./utils/supabase');

async function deleteTestJobs() {
    console.log('Buscando vagas de teste no banco de dados...');
    
    // Buscar a vaga que contém "Designer Test Beth" ou "Demo Tech P"
    const { data: testJobs, error } = await supabase
        .from('jobs')
        .select('*')
        .or('title.ilike.%test%,company.ilike.%demo tech%');

    if (error) {
        console.error('Erro na busca:', error);
        return;
    }

    if (!testJobs || testJobs.length === 0) {
        console.log('Nenhuma vaga de teste encontrada com os filtros atuais.');
        return;
    }

    console.log(`Encontradas ${testJobs.length} vagas suspeitas de serem testes:`);
    testJobs.forEach(job => {
        console.log(`- ID: ${job.id} | Titulo: ${job.title} | Empresa: ${job.company}`);
    });

    // Filtra para remover a especifica e possivelmente outras obvias
    const idsToDelete = testJobs.map(job => job.id);

    console.log('Deletando vagas...');
    const { error: deleteError } = await supabase
        .from('jobs')
        .delete()
        .in('id', idsToDelete);

    if (deleteError) {
        console.error('Erro ao deletar:', deleteError);
    } else {
        console.log('Vagas de teste apagadas com sucesso!');
    }
}

deleteTestJobs();
