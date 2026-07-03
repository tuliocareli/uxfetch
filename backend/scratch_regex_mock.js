const title = "Editor de Vídeos";
const t = title.toLowerCase();

// COMO ESTAVA NO FRONTEND ANTES DA NOSSA CORREÇÃO:
// Repare que só tem "v[ií]deo" (singular)
const regexIsPlusExplicit = /\b(motion|v[ií]deo|videomaker|audiovisual|digital)\b/i;
const isPlusExplicit = regexIsPlusExplicit.test(t);

// Regexes de outras áreas (resumidas para o mock)
const isLeadership = false;
const isUxUiProduct = false;

const isGraphicExplicit = /\b(graphic|gr[aá]fico|visual|brand|digital)\b/i.test(t);

// A REGRA MATADORA (FALLBACK DE GRÁFICO):
const isGraphic = isGraphicExplicit || (!isPlusExplicit && !isLeadership && !isUxUiProduct);

console.log("=== SIMULAÇÃO DO BUG ANTIGO ===");
console.log(`Vaga testada: "${title}"`);
console.log(`- Passou no filtro de Vídeo/Motion? ${isPlusExplicit}`);
console.log(`- Passou no filtro UX/UI? ${isUxUiProduct}`);
console.log(`- Passou no filtro explícito de Gráfico? ${isGraphicExplicit}`);
console.log(`\nRESULTADO FINAL: Caiu em Gráfico pelo Fallback? ${isGraphic}`);
console.log("\nPor que vazou? Porque 'vídeos' não deu match em '\\b(v[ií]deo)\\b' devido ao 's', e como não era nem UX nem Liderança, ativou a sobra de Gráfico.");
