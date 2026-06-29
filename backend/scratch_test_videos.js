const t = 'Editor de Vídeos'.toLowerCase();
const isVideoMotion = /\b(video|v[ií]deo|videomaker|audiovisual|edi[çc][ãa]o|motion|3d|after effects|premiere|anima[çc][ãa]o)\b/i.test(t);
console.log('isVideoMotion:', isVideoMotion);

const isPlusExplicit = /\b(game|cad|graphic|gr[aá]fico|visual|brand|marketing|arte|social media|ilustra|moda|interiores|embalagem|t[êe]xtil|criativo|criativos|comunica[çc][ãa]o|publicidade|digital)\b/i.test(t) || isVideoMotion;
const isLeadership = /\b(lead|head|staff|principal|manager|diretor|coordinator)\b/i.test(t);

const isUxUiProduct = /\b(ux|ui|product|produto|research|pesquisa|service|experi[êe]ncia|usabilidade|interface)\b/i.test(t);
const isUxUi = isUxUiProduct && !isVideoMotion;

const isGraphicExplicit = /\b(graphic|gr[aá]fico|visual|brand|marketing|arte|social media|criativo|criativos|comunica[çc][ãa]o|publicidade|digital)\b/i.test(t);
const isGraphic = (isGraphicExplicit || (!isPlusExplicit && !isLeadership && !isUxUiProduct)) && !isVideoMotion && !isUxUiProduct;

const isOthers = /\b(ilustra|game|cad|moda|interiores|embalagem|t[êe]xtil)\b/i.test(t) || isVideoMotion;

console.log('isUxUiProduct:', isUxUiProduct);
console.log('isUxUi:', isUxUi);
console.log('isGraphic:', isGraphic);
console.log('isOthers:', isOthers);
