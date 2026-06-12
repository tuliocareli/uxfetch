const fs = require('fs');
const appendText = `
---

## Atualização: Filtros Inteligentes (Mural de Vagas)
Implementamos uma barra de filtros responsiva na página do Mural de Vagas para melhorar drasticamente a usabilidade.

### Arquitetura Client-Side
O motor Javascript da página \`vagas.html\` agora baixa o banco de dados inteiro (que é super leve) em um \`cache\`. O resultado é que os cliques nos filtros respondem na velocidade da luz (sem novos *loadings* com o banco de dados).

### Funcionalidades:
1. **Pílulas (Modelos de Trabalho):** Botões dinâmicos onde é possível ativar combinações como [Remoto] e [Híbrido] ao mesmo tempo.
2. **Localização Exata (IBGE):** Reutilizamos o seletor da página principal. Agora é possível filtrar o Brasil inteiro, focando em Estados e/ou Cidades específicas.
`;

fs.appendFileSync('e:/Scraper/walkthrough.md', appendText);
console.log('Appended walkthrough');
