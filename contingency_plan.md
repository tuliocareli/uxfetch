# 🚨 Plano de Contingência: Limites de Disparo de E-mail (Resend)

Este documento interno define o radar de risco e as estratégias de escalabilidade caso o projeto atinja o limite do Tier Gratuito da plataforma Resend (3.000 disparos/mês).

## 1. A Matemática do Risco
Embora o cálculo básico baseado em 21 dias úteis sugira um teto de 142 usuários, o limite de segurança prático é menor.

- **Meses Longos:** Meses com 22 ou 23 dias úteis consomem muito mais. (Ex: 142 usuários x 23 dias = 3.266 envios).
- **Consumo Indireto:** Testes manuais do cronjob, futuros e-mails de Boas-Vindas ou confirmações de cancelamento também dividem esse teto.
- **Linha Vermelha (Redline):** O alarme deve soar quando o banco de dados atingir **120 inscritos ativos**.

## 2. Estratégias de Mitigação (Sem Custos)

### A. O "Weekly Digest" para Usuários Inativos
Se chegarmos perto do limite, podemos reduzir o desperdício alterando a frequência de envio para usuários que não engajam com o produto.

* **Regra Sugerida:** Criar um script que analisa a data do último clique/abertura. Se o usuário não clica em nada há mais de 15 dias, a coluna `frequency` dele no banco muda de `daily` para `weekly`.
* **Impacto:** Ele passa a receber apenas 1 e-mail na sexta-feira com o resumão (Boletim). Economiza-se 4 disparos por semana por usuário inativo, liberando uma margem gigantesca na Resend. Além de melhorar a reputação do domínio contra Filtros de Spam (provedores odeiam e-mails não abertos).

## 3. Estratégias de Escalabilidade (Com Custos)

Quando o limite de 3.000 mensais for insustentável mesmo com otimizações de base, e o produto estiver provando seu valor (Product-Market Fit validado com +120 usuários engajados):

### A. Atualização de Plano (Resend Pro)
- Custo de $20/mês para 50.000 envios.
- É a via de menor atrito (zero código).
- Pode ser financiada puramente pela comunidade (se o CTA de doação "Apoie com um café" cobrir o valor mensal, a plataforma se torna autossustentável).

### B. Migração Nativa (Amazon AWS SES)
- Se a doação não for suficiente ou quisermos redução extrema de custos, podemos contornar a Resend.
- A Resend é essencialmente um "embelezador" por cima da Amazon SES.
- **Custo AWS SES:** $0.10 a cada 1.000 envios. (Ou seja, 10.000 e-mails custariam apenas 1 dólar).
- **Desvantagem:** Requer dedicação de engenharia para trocar a API no Node.js e refazer o setup de DNS, DKIM, SPF para autenticação na nuvem da Amazon. Mas financeiramente é a solução definitiva de longo prazo para projetos independentes.
