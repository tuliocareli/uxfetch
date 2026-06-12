# 🛡️ Security Rules & Best Practices

Este documento atua como o **Contrato de Segurança Obrigatório** para o projeto. Como engenheiro de software sênior (Antigravity), eu memorizei e cumprirei rigorosamente as seguintes diretrizes na geração de qualquer código ou configuração para este projeto:

## 1. Zero Hardcoding de Credenciais
- **Regra:** Em NENHUMA hipótese chaves privadas (ex: `SUPABASE_SERVICE_KEY`, `RESEND_API_KEY`, Senhas de DB) devem ser escritas diretamente nos arquivos de código (`.js`, `.ts`, etc).
- **Ação:** Todo e qualquer acesso a chaves será feito estritamente através de variáveis de ambiente (`process.env.NOME_DA_CHAVE`).

## 2. Controle Estrito de Repositório (.gitignore)
- **Regra:** O arquivo `.env` nunca deve ser "comitado" ou exposto no repositório público.
- **Ação:** O arquivo `.gitignore` deve ser o primeiro arquivo criado/atualizado no projeto Node.js, contendo obrigatoriamente:
  ```text
  .env
  .env.local
  node_modules/
  ```

## 3. Row Level Security (RLS) Blindado
- **Regra:** O banco de dados (Supabase) não pode confiar cegamente em requisições externas. A chave `Anon Public Key` será exposta no front-end, logo, o banco deve se proteger sozinho.
- **Ação (Tabela `subscribers`):**
  - Permitir `INSERT` apenas para inserção de dados (formulário).
  - Bloquear e proibir `SELECT`, `UPDATE` e `DELETE` para a role `anon`. Dados de usuários são invisíveis para requisições não autenticadas.
- **Ação (Tabela `jobs`):**
  - O scraper usará a `Service Role Key` para ter passe livre na inserção.

## 4. Segurança em CI/CD (GitHub Actions)
- **Regra:** Workflows de automação não podem conter chaves abertas nos arquivos `.yml`.
- **Ação:** O arquivo `daily_fetch.yml` passará as credenciais para o script Node.js injetando-as estritamente via GitHub Secrets:
  ```yaml
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
    RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
  ```

## 5. Exposição Mínima de Superfície no Front-end
- **Regra:** O front-end estático (Client-side) só deve ter acesso às chaves estritamente necessárias para comunicação pública.
- **Ação:** O client-side inicializará o Supabase apenas com a **URL Pública** e a **Anon Public Key**. Nenhuma lógica de negócio sensível ou de extração/scraping deverá rodar no navegador do cliente.

---
*Nota interna para a IA: Este documento é prioritário. Todas as implementações de código subsequentes devem passar por este checklist de segurança antes de serem apresentadas ao usuário.*
