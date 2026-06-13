# Relatório de Viabilidade: Novos Portais de Vagas para Scraping

Este documento analisa a viabilidade técnica, os métodos de raspagem recomendados, os riscos de bloqueio e a relevância de novos portais de vagas nacionais e internacionais de UX/UI/Product Design para o **UX Fetch**.

---

## 📊 Tabela Comparativa de Viabilidade

| Portal | Tipo | Viabilidade | Método Técnico | Risco de Bloqueio (Cloudflare/Auth) | Volume de UX/UI | Observações / Ações |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Remotive** | Internacional (Remoto) | **Inviável (0%)** | JSON API Pública / HTML | Nenhum | Nulo (Gratuito) | Mudança de modelo: API pública foi limitada (~30 vagas totais) e >99% das vagas estão restritas por um Paywall. |
| **We Work Remotely (WWR)** | Internacional (Remoto) | **Alta (95%)** | RSS Feed (XML) | Mínimo | Alto | Feed RSS limpo e de rápido processamento. Necessita filtro geográfico no texto. |
| **GeekHunter** | Nacional (BR) | **Média-Alta (75%)** | Puppeteer (DOM) | Baixo | Médio-Alto | Next.js App Router (RSC). Requer Puppeteer para renderizar botões de página. |
| **Coodesh** | Nacional (BR) | **Média-Baixa (40%)** | Puppeteer (DOM) | Baixo | Baixo | Página pública exibe apenas 7 vagas genéricas; filtros de busca e paginação não alteram resultados públicos. |
| **APinfo** | Nacional (BR) | **Baixa (20%)** | Axios + Cheerio | Baixo | Muito Baixo | Site HTML clássico, porém voltado 99% para infraestrutura e desenvolvimento legacy. |
| **99jobs** | Nacional (BR) | **Baixa (10%)** | Puppeteer / API | Alto (Auth Wall) | Médio | Redireciona buscas públicas para páginas de login. |
| **Indeed / LinkedIn** | Nacional / Global | **Muito Baixa (<5%)** | Proxies / Scraping complexo | Altíssimo (Cloudflare/hCaptcha) | Altíssimo | Bloqueiam requisições comuns em segundos. Inviável sem proxies residenciais caros. |
| **Catho / Glassdoor** | Nacional / Global | **Muito Baixa (<5%)** | Proxies / Scraping complexo | Altíssimo (Datadome/Cloudflare) | Médio | Retornam status 403/404 ou Captchas constantes em acessos automatizados. |
| **Hipsters.Jobs** | Nacional (BR) | **Inviável (0%)** | - | - | Nulo | **Desativado permanentemente** em 12 de Novembro de 2025 para transição à Talent Lab Alura. |

---

## 🔍 Detalhamento das Descobertas Técnicas

### 1. Remotive (API Oficial)
* **URL:** `https://remotive.com/api/remote-jobs?category=design`
* **Viabilidade:** **Inviável (Paywall / API Limitada)**.
* **Pontos Positivos:** 
  - A estrutura da API original era excelente, porém não é mais funcional no plano gratuito.
* **Pontos de Atenção (Atualização):**
  - **Paywall:** A Remotive alterou seu modelo de negócios. A API pública agora retorna uma amostra ínfima (cerca de 27 vagas no total global da plataforma).
  - A imensa maioria das vagas (mais de 155.000) foi ocultada no site sob a mensagem *"Unlock 155,000+ jobs"*. Não é mais uma fonte gratuita viável.

### 2. We Work Remotely (WWR)
* **URL:** `https://weworkremotely.com/categories/remote-design-jobs.rss`
* **Viabilidade:** **Excelente (Validada)**. O feed de RSS em XML retorna as vagas publicadas na categoria de design.
* **Pontos Positivos:**
  - Leitura instantânea via parser XML padrão sem risco de bloqueios.
  - **Validação Local:** Testes recentes confirmaram que cerca de 80% do feed atual é marcado como `<region>Anywhere in the World</region>`. O feed inclui excelentes vagas de UX/Product Design internacionais e até de empresas brasileiras (como CI&T e Lyncas) anunciando posições de design remotas.
* **Pontos de Atenção:**
  - Exige parse defensivo: Ocasionalmente, vagas vêm com a `<region>` genérica, mas incluem "USA ONLY" ou similar direto no `<title>` (identificado nos testes locais). É preciso criar uma regra simples para ignorar esses casos.

### 3. GeekHunter
* **URL:** `https://www.geekhunter.com.br/vagas`
* **Viabilidade:** **Boa**.
* **Comportamento Técnico:** 
  - O site é construído em Next.js (App Router). O HTML inicial traz a árvore de componentes em formato de stream serializado (`self.__next_f.push`), o que inviabiliza Cheerio estático direto.
  - Usando Puppeteer com delay de hidratação (5s), a página renderiza perfeitamente em torno de 10 vagas por página com link no padrão `https://www.geekhunter.com.br/{empresa}/jobs/{slug_vaga}`.
  - A paginação utiliza botões de Chakra UI (`BUTTON`) que atualizam o estado React em vez de links normais. O Puppeteer consegue clicar programaticamente ou mapear os patches do NextJS.

### 4. Coodesh
* **URL:** `https://coodesh.com/jobs`
* **Viabilidade:** **Média-Baixa**.
* **Comportamento Técnico:**
  - O site possui um visual moderno em Next.js, mas a listagem pública exibe apenas 7 vagas estáticas por vez.
  - Testes automatizados revelaram que passar parâmetros de URL (`?search=ux`, `?q=ux`) ou digitar na barra de pesquisa e submeter via Puppeteer altera a URL no browser, mas a lista de vagas exibida permanece exatamente idêntica (mostrando vagas genéricas de suporte, segurança, analista e apenas 1 de designer gráfico).
  - Não há botões de paginação ou rolagem infinita ativos para visitantes não logados.

### 5. Indeed, LinkedIn, Catho e Glassdoor
* **Viabilidade:** **Inviáveis para o estágio atual**.
* **Comportamento Técnico:**
  - **Indeed/LinkedIn:** Bloqueiam imediatamente com Cloudflare. Exigem simulação extrema de comportamento humano ou integração com serviços pagos de proxy rotativo residencial para obter qualquer HTML legível.
  - **Catho/Glassdoor:** O motor de detecção de bots (como Datadome) responde com 403/404 imediatamente ao menor sinal de automação (mesmo simulando cabeçalhos de navegador modernos).

---

## 💡 Recomendação para o UX Fetch

1. **Prioridade 1: We Work Remotely (WWR)**
   - Viabilidade comprovada e esforço de implementação baixíssimo via parse do XML.
   - Excelente volume de vagas de Product/UX Design categorizadas como "Anywhere in the World", suprindo bem o espaço deixado pela Remotive.

2. **Prioridade 2: GeekHunter**
   - Excelente para vagas nacionais (CLT/PJ).
   - Requer o uso de Puppeteer (similar ao fluxo de `scrapers/solides.js`), clicando nos botões de paginação.

---

## 🌍 Diretrizes para Vagas Internacionais (Produto & UX)

Durante a fase de pesquisa, definimos as seguintes regras de negócio para a inclusão de vagas gringas no portal:

### 1. Tradução Automatizada de Custo Zero
Para garantir que as vagas internacionais sejam acessíveis aos brasileiros sem fluência em inglês, faremos a tradução automática da descrição e do título das vagas no momento da extração.
* **Tecnologia:** API Gratuita do Gemini (Gemini 1.5 Flash).
* **Viabilidade e Custo:** **Custo $0.00**. O volume diário de novas vagas internacionais estimadas é perfeitamente coberto pelas cotas gratuitas do Gemini (1.500 requests/dia, 1M tokens/min).
* **Solução Técnica (Rate Limit):** A API gratuita possui um limite de 15 requisições por minuto. Para evitar erros *Too Many Requests*, o scraper executará a tradução sequencialmente, adicionando um **delay fixo de ~4 segundos** entre cada vaga traduzida. Como o script roda em background (cronjob) de madrugada, esse leve aumento de tempo não impacta o sistema.
* **Vantagem Adicional:** A inteligência do Gemini permite manter jargões de UX/UI em inglês (ex: *Wireframe*, *Hand-off*, *UI Kit*) intactos na tradução, evitando resultados literais e confusos.

### 2. Filtros e Intercalação (Sortimento) no Mural
Para que as vagas em Dólar/Euro não ofusquem as vagas CLT/PJ nacionais, estabelecemos as seguintes regras de UI/UX:
* **Filtros Claros:** Adição de chips ou toggles na UI (ex: `[Nacional]` e `[Internacional]`) mapeados pela propriedade `is_international` (ou similar) extraída da fonte.
* **Interleaving (Intercalação) de Conteúdo:** 
  - **No Mural Padrão:** As consultas não serão puramente cronológicas. Faremos fetch separando blocos nacionais e internacionais e intercalaremos os itens no feed respeitando uma proporção (ex: a cada 3 ou 4 vagas nacionais, injetamos 1 vaga internacional).
  - **No Disparo de E-mail:** A mesma lógica se aplica na montagem do template de newsletter diário/semanal, garantindo que as oportunidades gringas surjam como "destaques" ou bônus no meio do conteúdo focado no mercado interno, sem monopolizar o espaço.
