require('dotenv').config();
const supabase = require('./utils/supabase');

async function main() {
  const { data: jobs, error } = await supabase.from('jobs').select('*');
  if (error) {
    console.error('Error fetching jobs:', error);
    return;
  }

  console.log(`Total de vagas: ${jobs.length}`);

  // 1. Áreas (Baseado na lógica de script.js ou index.js)
  let coreCount = 0; // UX, UI, Product
  let graphicCount = 0; // Graphic, Visual
  let leadershipCount = 0;
  let othersCount = 0; // Motion, Video, etc

  // 2. Formato
  let remoteCount = 0;
  let hybridCount = 0;
  let inPersonCount = 0;

  // 3. Plataformas (Source)
  const sourceCount = {};

  // 4. Dia da semana
  const dayOfWeekCount = {
    0: 0, // Domingo
    1: 0, // Seg
    2: 0, // Ter
    3: 0, // Qua
    4: 0, // Qui
    5: 0, // Sex
    6: 0  // Sab
  };

  for (const job of jobs) {
    const t = (job.title || '').toLowerCase();
    
    // Areas
    const isVideoMotion = /\b(videos?|v[ií]deos?|videomaker|filmmaker|audiovisual|edi[çc][ãa]o|motion|3d|after effects|premiere|anima[çc][ãa]o|animador|animadora|vfx|capcut|cinema|cinegrafista|fotografia|fot[óo]grafo|c4d|blender|maya|zbrush|render)\b/i.test(t);
    const isPlusExplicit = /\b(game|cad|graphic|gr[aá]fico|visual|brand|marketing|arte|social media|ilustra|moda|interiores|embalagem|t[êe]xtil|criativo|criativos|comunica[çc][ãa]o|publicidade|digital)\b/i.test(t) || isVideoMotion;
    const isLeadership = /\b(lead|head|staff|principal|manager|diretor|coordinator)\b/i.test(t) && !t.includes('diretor de arte');
    const isUxUiProduct = /\b(ux|ui|product|produto|research|pesquisa|service|experi[êe]ncia|usabilidade|interface|design engineer|engenheir[oa] de design|design ops|design system)\b/i.test(t);
    const isUxUi = isUxUiProduct && !isVideoMotion;
    const isGraphicExplicit = /\b(graphic|gr[aá]fico|visual|brand|marketing|arte|social media|criativo|criativos|comunica[çc][ãa]o|publicidade|digital)\b/i.test(t);
    const isGraphic = (isGraphicExplicit || (!isPlusExplicit && !isLeadership && !isUxUiProduct)) && !isVideoMotion && !isUxUiProduct;
    const isOthers = /\b(ilustra|game|cad|moda|interiores|embalagem|t[êe]xtil)\b/i.test(t) || isVideoMotion;

    if (isLeadership) leadershipCount++;
    if (isGraphic) graphicCount++;
    if (isOthers) othersCount++;
    if (isUxUi) coreCount++;

    // Work Mode
    if (job.work_mode === 'remote') remoteCount++;
    else if (job.work_mode === 'hybrid') hybridCount++;
    else if (job.work_mode === 'in_person') inPersonCount++;

    // Source
    const source = job.source || 'Unknown';
    sourceCount[source] = (sourceCount[source] || 0) + 1;

    // Day of week
    if (job.created_at) {
      const date = new Date(job.created_at);
      dayOfWeekCount[date.getDay()]++;
    }
  }

  console.log('\n--- 1. ÁREAS ---');
  console.log(`Produto/UX/UI (Core): ${coreCount}`);
  console.log(`Design Gráfico/Visual (Plus): ${graphicCount}`);
  console.log(`Liderança: ${leadershipCount}`);
  console.log(`Vídeo/Motion/Outros: ${othersCount}`);

  console.log('\n--- 2. FORMATO DE TRABALHO ---');
  console.log(`Remoto: ${remoteCount}`);
  console.log(`Híbrido: ${hybridCount}`);
  console.log(`Presencial: ${inPersonCount}`);

  console.log('\n--- 3. PLATAFORMAS (SOURCE) ---');
  Object.entries(sourceCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`${source}: ${count}`);
    });

  console.log('\n--- 4. DIA DA SEMANA ---');
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  Object.entries(dayOfWeekCount)
    .forEach(([day, count]) => {
      console.log(`${days[day]}: ${count}`);
    });
}

main();
