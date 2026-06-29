const supabase = require('./utils/supabase');
const emails = ['suellen.lleao@gmail.com', 'willnovaes19@gmail.com', 'viniciusmaitan1@gmail.com', 'edug.desenho@gmail.com', 'sabrinasandrade10@gmail.com', 'contato@tuliocareli.com', 'tctulio2009@gmail.com', 'vlrlima2908@gmail.com', 'alleccrim@gmail.com', 'lincolnaguiar@hotmail.com', 'contato@liviabarbosa.com', 'liviabarbosa0922@gmail.com', 'dio.ex2@gmail.com', 'eu@jacksonjunior.com'];

async function check() { 
    const { data, error } = await supabase.from('subscribers').select('email, preferred_roles, preferred_seniorities').in('email', emails); 
    if (error) {
        console.error(error);
    } else { 
        const withPrefs = data.filter(s => (s.preferred_roles && s.preferred_roles.length > 0) || (s.preferred_seniorities && s.preferred_seniorities.length > 0)); 
        if (withPrefs.length === 0) {
            console.log('Nenhum dos 14 preencheu preferências ainda.'); 
        } else { 
            console.log('--- PREFERÊNCIAS PREENCHIDAS ---'); 
            withPrefs.forEach(s => console.log('Email:', s.email, '| Áreas:', s.preferred_roles, '| Senioridade:', s.preferred_seniorities)); 
        } 
    } 
} 
check();
