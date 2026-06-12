const fs = require('fs');

const appendText = `
---

# Feature: Paginação Client-Side no Mural de Vagas

## Racional
Exibir 150 vagas em um scroll infinito pode se tornar cansativo e prejudica a estética premium da página. Uma paginação elegante soluciona o peso cognitivo, melhora a navegação e organiza a visualização.

## Proposed Changes

### 1. Estrutura HTML
- Modificar frontend/vagas.html
- Abaixo da div \`#jobsGrid\`, inserir um contêiner \`<div class="pagination-container">\`.

### 2. Estilização Premium (CSS)
- Modificar frontend/styles.css
- Adicionar estilos para os botões de paginação, com um design minimalista, \`hover\` elegante e destaque para a página ativa usando \`var(--primary)\`.

### 3. Lógica de Estado (Javascript)
- Modificar frontend/script.js
- Criar variáveis \`currentPage = 1\` e \`jobsPerPage = 21\` (múltiplo de 3, ideal para grades).
- Ao invés de o \`renderJobs\` injetar tudo, ele fará um \`.slice()\` na array de vagas filtradas baseada na página atual.
- Criar uma função \`renderPagination(totalJobs)\` que vai desenhar os números das páginas (1, 2, 3...) e os botões de \`Anterior\` e \`Próximo\`.
- Sempre que o usuário clicar em um filtro novo, a \`currentPage\` volta para a página 1.
- Sempre que ele mudar de página, damos um scroll suave para o topo da grade de vagas.
`;

fs.appendFileSync('e:/Scraper/implementation_plan.md', appendText);
console.log('Appended to plan');
