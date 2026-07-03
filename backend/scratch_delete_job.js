require('dotenv').config();
const supabase = require('./utils/supabase');

async function run() {
    console.log('Buscando vaga: Designer Test Beth...');
    const { data, error } = await supabase
        .from('jobs')
        .select('id, title, company, source')
        .ilike('title', '%Designer Test Beth%');
    
    if (error) {
        console.error('Erro na busca:', error);
        return;
    }
    
    console.log('Vagas encontradas:', data);
    
    if (data && data.length > 0) {
        console.log('Deletando...');
        const { error: delError } = await supabase
            .from('jobs')
            .delete()
            .ilike('title', '%Designer Test Beth%');
            
        if (delError) {
            console.error('Erro ao deletar:', delError);
        } else {
            console.log('Vaga deletada com sucesso do banco de dados!');
        }
    } else {
        console.log('Nenhuma vaga encontrada com esse título.');
    }
}
run();
