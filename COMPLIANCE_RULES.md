# 🛡️ Regras de Compliance, Segurança e Legalidade (Web Scraping)

Esta documentação define as barreiras éticas e legais inegociáveis do projeto UX Fetch. Antes de desenvolver qualquer novo Scraper, Motor de Agregação ou Funcionalidade, o código DEVE ser validado contra estes 4 pilares:

## 1. Escopo de Coleta (Dados Públicos vs Autenticados)
- **REGRA:** É terminantemente proibido tentar burlar sistemas de login, contornar paywalls ou acessar áreas restritas para raspar dados.
- **AÇÃO:** Só é permitido varrer URLs abertas onde qualquer visitante sem conta (Guest) conseguiria ler a informação livremente.

## 2. LGPD e Proteção de Dados Sensíveis
- **REGRA:** Nenhuma informação pessoal (PII) pode ser extraída, processada ou persistida no banco de dados.
- **AÇÃO:** É proibido capturar nomes de recrutadores, e-mails pessoais de RH, telefones ou perfis de outros candidatos. O banco de dados (`jobs`) deve conter apenas dados de natureza comercial/corporativa: Título, Descrição da Vaga, Empresa e URL de Destino.

## 3. Integridade do Tráfego (Não-hospedagem)
- **REGRA:** O UX Fetch é um motor de busca e agregador, não um usurpador de conteúdo.
- **AÇÃO:** O conteúdo original completo NUNCA deve ser replicado. O Scraper deve armazenar apenas "metadados" e um pequeno resumo (`excerpt` de ~3 linhas) para fins de indexação. O usuário deve SEMPRE ser direcionado via link direto para a plataforma original para concluir a ação, gerando tráfego útil para os criadores do conteúdo.

## 4. Impacto Técnico no Servidor (Rate Limiting)
- **REGRA:** É proibido gerar sobrecarga (DDoS acidental) nos servidores de terceiros.
- **AÇÃO:** Todo script de automação (`Puppeteer`, `Axios`, `Cheerio`) DEVE possuir um **Delay Estocástico** (ex: `setTimeout` randômico entre 1500ms e 3500ms) inserido explicitamente entre as requisições em lote. O robô deve simular o tempo de leitura e navegação de um ser humano padrão.
