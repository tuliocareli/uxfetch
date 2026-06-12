const fs = require('fs');
const appendText = `
---

# Implementação: Filtros Inteligentes no Mural de Vagas

A página vagas.html ganhará uma barra de filtros responsiva e de alta performance, permitindo que os designers encontrem a vaga perfeita.

## Filtragem Client-Side (Velocidade Extrema)
Atualmente nós temos pouco mais de 150 vagas ativas (já que limpamos a cada 30 dias). Minha sugestão é que o Javascript baixe todas essas vagas ativas de uma vez ao abrir a página (é um peso microscópico, não consome banda). Assim, os filtros funcionarão instantaneamente na tela, sem a bolinha de 'Sincronizando com o radar...' aparecer toda vez que o usuário clicar no botão de Remoto ou mudar a cidade. A experiência ficará super premium.

## 1. Barra de Filtros (Layout)
- Modificar frontend/vagas.html
- Logo abaixo do Header (ou no topo da grade de vagas), injetar uma <section class="filters-bar">.
- Filtro de Modelo de Trabalho: 3 botões em formato de 'Pílula' (Pills) selecionáveis: [ Remoto ], [ Híbrido ], [ Presencial ]. (O usuário poderá marcar múltiplos).
- Filtro de Localização: Reutilizar o design fluido dos seletores de Estado e Cidade, adicionando a opção extra 'Todo o Brasil'. 

## 2. Estilização Premium (CSS)
- Modificar frontend/styles.css
- Adicionar estilos para as 'Pílulas' de modelo de trabalho. Elas terão animações suaves de transição, fundo claro quando inativas, e nosso azul var(--primary) com fonte branca quando ativas.
- Ajustar o layout flexível para garantir que a barra de filtros seja scrollável horizontalmente no celular.

## 3. Motor de Busca (Javascript)
- Modificar frontend/script.js
- No vagas.html, alterar a query inicial do Supabase para puxar todas as vagas (removendo o .limit(100)).
- Armazenar as vagas em uma variável global allJobsCache = [].
- Criar a função renderJobs() que será chamada toda vez que um filtro for alterado.
- Adicionar a mesma lógica da API do IBGE que usamos na home, mas agora aplicada aos seletores da página de Vagas.
- A função de renderização fará a intersecção: se o usuário marcar [Remoto], verificaremos a flag is_remote ou o texto em location.
`;

fs.appendFileSync('e:/Scraper/implementation_plan.md', appendText);
console.log('Appended successfully');
