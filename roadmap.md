# 🗺️ Roadmap UX Fetch: Próximos Passos (Fase 2)

Este documento centraliza as funcionalidades planejadas para a próxima grande atualização do **UX Fetch**, visando transformar o projeto de um simples motor de alertas para uma plataforma completa e autossustentável.

---

## 1. Plataforma Web: Seção de Vagas em Aberto
**Objetivo:** Expandir a Landing Page para incluir um "Mural de Vagas", permitindo que novos usuários ou pessoas que não querem receber e-mails possam consultar as oportunidades disponíveis.

**Estratégia de Implementação:**
- **Banco de Dados (Supabase):** Criar uma política de segurança (RLS) de leitura pública (somente leitura) na tabela `jobs`, permitindo que o frontend baixe a lista de vagas.
- **Interface:** Criar uma página `vagas.html` com um layout de lista/cards. 
- **Lógica (JS):** Fazer uma requisição filtrando as vagas mais recentes (`ORDER BY created_at DESC`).
- **Limpeza:** O Scraper deverá ganhar uma rotina de exclusão ou arquivamento de vagas com mais de 30 ou 45 dias, para que o mural não mostre vagas "fantasmas" que já fecharam na empresa original.

---

## 2. E-mails Estratégicos: Seção "Ainda em Aberto"
**Objetivo:** Criar um modelo híbrido no alerta diário: entregar o impacto das vagas **inéditas**, mas sem deixar que vagas excelentes de ontem caiam no esquecimento.

**Estratégia de Implementação:**
- **Filtro Temporal:** Alterar o `index.js` para puxar duas listas do banco:
  1. `newJobs` (Vagas inéditas do dia).
  2. `recentJobs` (Vagas coletadas há no máximo 7 dias, sorteando de 3 a 5 aleatoriamente ou filtrando por relevância).
- **Redesign do Template (`template.html`):** Abaixo da seção principal de "Novas Oportunidades", incluir um divisor e um título como *"📌 Ainda dá tempo: Oportunidades recentes"*.
- **Hierarquia Visual:** As vagas antigas devem ter um card mais sutil e reduzido (sem a descrição completa de 3 linhas, apenas Título e Empresa), para manter o foco na novidade.

---

## 3. Autossustentabilidade: Lógica de Doações
**Objetivo:** Aproveitar a proposta de valor clara do projeto (fazer o usuário economizar horas e conseguir empregos) para incentivar o financiamento coletivo e cobrir os custos operacionais de API/Hospedagem.

**Estratégia de Implementação:**
- **A Plataforma:** Definir o meio de recebimento. Sugestões: 
  - *Buy Me A Coffee* (Internacional, muito usado por devs/designers).
  - *Apoia.se* ou *LivePix / PagSeguro* (Nacional, suporte nativo a PIX).
- **Integração na Landing Page (`index.html`):** Adicionar um card visual amigável próximo ao rodapé com a copy: *"O UX Fetch é 100% gratuito, open-source e livre de anúncios. Se o robô te ajudou, considere pagar um café para mantermos o servidor rodando!"*
- **Integração no E-mail (`template.html`):** 
  - Aproveitar a proximidade do CTA de *"Compartilhar a Vitória"*.
  - Incluir um botão secundário (Design Outline) com a chamada *"Apoiar o Projeto"*.
  - Garantir que o texto soe orgânico e transparente. Em projetos "De desenvolvedor para designer", a honestidade sobre os custos do servidor converte muito mais do que banners publicitários.
