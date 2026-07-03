# Arquitetura e Contexto do Orquestrador (index.js)

Este arquivo serve como o mapa mental da IA para o funcionamento exato da plataforma UX Fetch PRO. **NUNCA DEVE SER DELETADO.**

## 1. Fluxo Principal da Esteira (Stateless)
A esteira é executada de forma autônoma via GitHub Actions (seg. a sex. 08:00 BRT). Ela não depende de estados anteriores na memória, apenas do que está no Banco de Dados (Supabase).
1. **Scraping (Coleta):** Aciona sequencialmente os 13 scrapers hospedados na pasta `scrapers/`. Trata erros individuais e formata tudo em um array gigante (`allJobs`). Usa o Gemini 2.5 Flash para traduzir vagas internacionais (respeitando *rate limits* com retentativas).
2. **Filtragem de Ineditismo:** Busca no Supabase todas as URLs (`existingUrls`). O que não existir no banco é considerado **Vaga Inédita (`newJobs`)**.
3. **Upsert no Banco (O Mural):** Aplica uma validação rigorosa (rejeitando vagas que não tenham `url`, `title`, `company`, `location` e `source`). Salva no Supabase. Isso **popula o Mural Web instantaneamente**.
4. **Recuperação de IDs:** Associa os UUIDs reais que o banco gerou de volta às vagas em memória, garantindo que os links de redirecionamento do e-mail (`?id=UUID`) funcionem.
5. **Sunset Policy:** Varre os usuários do banco. Se está inativo há >60 dias, desativa. Se não abriu nas últimas 2 semanas, coloca na geladeira (só recebe sexta-feira). Pega os `activeSubscribers` aptos pro dia.
6. **Disparo de E-mails:** Roda a máquina de Regex. Filtra a vaga perfeitamente para as preferências do usuário. Envia via Resend, com atraso de ~300ms entre envios para evitar punições de Rate Limit.

## 2. A Máquina de Regex (O Filtro Semântico)
O núcleo inteligente do negócio está na filtragem semântica em `index.js`.
- **Vídeo/Motion (Isolado em 'Others'):** Barrado estritamente através da const `isVideoMotion` (palavras como video, audiovisual, motion, 3d, vfx, blender). Se testar true, nunca cai em UX nem em Gráfico.
- **UX/UI e Produto:** O core do projeto. Exige a combinação de `isUxUiProduct` (ux, ui, product, research) e `!isVideoMotion`.
- **Liderança:** Termos como lead, head, staff, manager.
- **Gráfico:** O bucket de fallback e explícito para Design Gráfico, Visual, Marketing. Vagas que não são de vídeo, nem de liderança, nem UX estrito.

## 3. Comportamento do E-mail
- O E-mail só carrega Vagas Inéditas se houver.
- Tem um limite dinâmico (TARGET_PAYLOAD) focado em enviar um "digest" recheando o e-mail com Vagas Antigas (Recent) se o usuário não atingiu o limite de inéditas.
- Os botões no e-mail dependem puramente do Supabase ID gerado no passo 3. O redirecionamento no site front-end busca a vaga via API com esse ID.

## Regra de Ouro para Manutenção
Sempre que testar o código em `scratch`, **NÃO FAZER UPSERT NO BANCO** se quiser testar a esteira oficial depois. Se a vaga entrar no banco num teste, o script oficial a considerará velha e não enviará e-mails com ela.
