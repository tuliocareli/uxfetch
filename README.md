# ⚡ UX Fetch

> O radar automatizado de vagas para a comunidade de Product Design & UI/UX.

**UX Fetch** é um agregador e minerador de vagas de código aberto, criado para resolver a fragmentação na busca por oportunidades de design de produto no Brasil. Em vez de monitorar dezenas de plataformas de RH manualmente, o sistema varre a web, filtra o ruído e entrega um resumo diário com vagas curadas diretamente na caixa de entrada dos inscritos.

---

## 🎯 Por que este projeto existe?

Como designers, passamos muito tempo otimizando a jornada dos usuários, mas a jornada de procurar oportunidades no nosso próprio setor é ineficiente e dispersa. Criei o UX Fetch como um desafio técnico de **Design Engineering** para construir uma arquitetura autônoma, de custo zero e de utilidade pública para a comunidade de UX.

## ✨ Features

*   **Varredura Autônoma (Cron Jobs):** O motor de scraping roda silenciosamente todas as madrugadas, extraindo dados de plataformas dinâmicas de RH.
*   **Filtro de Escopo Restrito:** Algoritmo que ignora vagas genéricas e busca correspondências exatas (*Product Design, UI, UX, Interaction, Design Ops*).
*   **Match Geográfico & Remoto:** O sistema cruza os dados extraídos com as preferências do usuário (cidade base e formato de trabalho), garantindo alertas 100% personalizados.
*   **Disparo Transacional Limpo:** E-mails diários formatados com hierarquia visual clara, sem spam e sem links intermediários.

---

## 🏗️ Arquitetura & Tech Stack

O projeto foi desenhado focando em escalabilidade e custo zero de infraestrutura, dividindo as responsabilidades entre diferentes plataformas *Serverless*:

*   **Frontend & Telemetria:** HTML/CSS/JS focado em performance. Hospedado na **Vercel**. Métricas orgânicas e mapas de calor com **Google Analytics (GA4)** e **Microsoft Clarity** (sob consentimento).
*   **Database & Auth:** **Supabase** (PostgreSQL). Gerencia a tabela de usuários (`subscribers`) e o repositório de vagas (`jobs`) com regras de segurança estritas (RLS).
*   **Segurança (Anti-Spam):** O formulário é blindado pelo **Cloudflare Turnstile** invisível, que valida a humanidade do tráfego e aciona uma **Supabase Edge Function** (Deno) para inserir os dados com segurança máxima, descartando bots.
*   **Scraper Engine & AI:** **Node.js + Puppeteer**. Roda no modo *headless* via **GitHub Actions**. Antes de exibir as vagas, os dados passam por uma sanitização via Inteligência Artificial usando o **Google Gemini** para padronização semântica.
*   **Email Delivery:** Integração com a API do **Resend** (Amazon SES), acionada via lógica de cruzamento de dados diário.

---

## 🛡️ Privacidade (LGPD)

O UX Fetch foi projetado sob o princípio de *Privacy by Design*.
*   Coletamos apenas o mínimo necessário: e-mail, cidade e preferência de trabalho.
*   Não há rastreamento via cookies de marketing.
*   Os dados não são vendidos ou compartilhados com terceiros.
*   Os usuários possuem autonomia total para exclusão de seus dados via um clique (Opt-out) no rodapé de qualquer e-mail recebido.

---

## 🚀 Como rodar localmente (Scraper)

Se você deseja testar o motor de extração na sua máquina:

1. Clone este repositório:
```bash
git clone https://github.com/seu-usuario/uxfetch.git
cd uxfetch
```

2. Instale as dependências na pasta do scraper:
```bash
cd scraper
npm install
```

3. Configure as variáveis de ambiente:
Crie um arquivo `.env` na raiz da pasta `scraper` e adicione suas chaves (não faça commit deste arquivo):
```text
SUPABASE_URL=sua-url-aqui
SUPABASE_SERVICE_KEY=sua-chave-secreta-aqui
RESEND_API_KEY=sua-chave-do-resend-aqui
```

4. Execute o script principal de extração e match:
```bash
node index.js
```
