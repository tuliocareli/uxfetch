const dummyJobs = [
    { title: 'UX/UI Designer', work_mode: 'remote', location: 'Remoto' },
    { title: 'Product Designer', work_mode: 'remote', location: 'Remoto' },
    { title: 'Designer Gráfico', work_mode: 'remote', location: 'Remoto' },
    { title: 'Motion Designer', work_mode: 'remote', location: 'Remoto' },
    { title: 'Editor de Vídeo', work_mode: 'remote', location: 'Remoto' },
    { title: 'Videomaker', work_mode: 'remote', location: 'Remoto' },
    { title: 'Designer UX e Vídeo', work_mode: 'remote', location: 'Remoto' },
    { title: 'Head de Design', work_mode: 'remote', location: 'Remoto' },
];

function filterJobs(jobsToFilter, sub) {
    const prefRoles = (sub.preferred_roles && sub.preferred_roles.length > 0) 
        ? sub.preferred_roles 
        : ['ux_ui', 'leadership'];
    
    const prefSen = ['junior', 'pleno', 'senior', 'especialista'];

    return jobsToFilter.filter(job => {
        const t = job.title.toLowerCase();
        
        const isPlusExplicit = /\b(game|cad|graphic|gr[aá]fico|visual|brand|marketing|arte|social media|motion|3d|ilustra|moda|interiores|embalagem|t[êe]xtil|criativo|criativos|comunica[çc][ãa]o|publicidade|digital)\b/i.test(t);
        const isLeadership = /\b(lead|head|staff|principal|manager|diretor|coordinator)\b/i.test(t);
        
        const isUxUiProduct = /\b(ux|ui|product|produto|research|pesquisa|service|experi[êe]ncia|usabilidade|interface)\b/i.test(t);
        const isUxUi = isUxUiProduct;

        const isGraphic = /\b(graphic|gr[aá]fico|visual|brand|marketing|arte|social media|criativo|criativos|comunica[çc][ãa]o|publicidade|digital)\b/i.test(t) || (!isPlusExplicit && !isLeadership && !isUxUiProduct);
        
        const isOthers = /\b(motion|3d|ilustra|game|cad|moda|interiores|embalagem|t[êe]xtil)\b/i.test(t);

        let roleMatch = false;
        if (prefRoles.includes('leadership') && isLeadership) roleMatch = true;
        if (prefRoles.includes('graphic') && isGraphic) roleMatch = true;
        if (prefRoles.includes('others') && isOthers) roleMatch = true;
        if (prefRoles.includes('ux_ui') && isUxUi) roleMatch = true;
        
        return roleMatch;
    });
}

console.log('--- USER: ONLY UX_UI ---');
const subUx = { preferred_roles: ['ux_ui'], accept_remote: true };
console.log(filterJobs(dummyJobs, subUx).map(j => j.title));

console.log('\n--- USER: ONLY GRAPHIC ---');
const subGraphic = { preferred_roles: ['graphic'], accept_remote: true };
console.log(filterJobs(dummyJobs, subGraphic).map(j => j.title));

console.log('\n--- USER: ONLY OTHERS ---');
const subOthers = { preferred_roles: ['others'], accept_remote: true };
console.log(filterJobs(dummyJobs, subOthers).map(j => j.title));
