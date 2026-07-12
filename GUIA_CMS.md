# Guia Rápido do CMS (UX Fetch)

Este guia explica como configurar o acesso restrito ao painel de administração do Blog (CMS) usando a autenticação do Supabase. Apenas você terá acesso ao painel.

## Passo 1: Configurar a Segurança no Banco de Dados (Supabase)

Como a sua chave do site é pública (`anon_key`), qualquer pessoa poderia tentar salvar dados se descobrisse a URL. Para proteger, aplicamos regras RLS (Row Level Security) direto no banco.

Vá no **Supabase Dashboard** > **SQL Editor** e rode o comando abaixo:

```sql
-- 1. Garante que o RLS está ativado
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- 2. Limpa políticas antigas (se houver)
DROP POLICY IF EXISTS "Leitura Publica" ON blog_posts;
DROP POLICY IF EXISTS "Escrita Publica Temporaria" ON blog_posts;
DROP POLICY IF EXISTS "Atualizacao Publica Temporaria" ON blog_posts;

-- 3. Cria Política de LEITURA (Qualquer pessoa pode ver a home/artigos)
CREATE POLICY "Leitura Publica" 
ON blog_posts FOR SELECT 
USING (true);

-- 4. Cria Políticas de ESCRITA restritas apenas ao seu email
CREATE POLICY "Apenas admin pode inserir" 
ON blog_posts FOR INSERT 
WITH CHECK (auth.email() = 'tctulio2009@gmail.com');

CREATE POLICY "Apenas admin pode atualizar" 
ON blog_posts FOR UPDATE 
USING (auth.email() = 'tctulio2009@gmail.com');

CREATE POLICY "Apenas admin pode deletar" 
ON blog_posts FOR DELETE 
USING (auth.email() = 'tctulio2009@gmail.com');
```

## Passo 2: Criar o seu Usuário Administrador no Supabase

Você precisa cadastrar seu e-mail para conseguir fazer o login no painel:

1. Acesse o seu projeto no **Supabase Dashboard**.
2. No menu lateral esquerdo, clique em **Authentication**.
3. Na aba **Users**, clique no botão **Add User** -> **Create new user**.
4. Insira:
   - **Email:** `tctulio2009@gmail.com`
   - **Password:** Escolha uma senha segura e guarde-a.
5. Desmarque a opção *Auto Confirm User?* se não quiser validar o email, ou marque para já deixar ativo instantaneamente (recomendado marcar para simplificar).
6. Clique em **Create User**.

*(Dica: certifique-se de que o Provider "Email" está habilitado nas configurações de autenticação do Supabase, o que costuma ser padrão).*

## Passo 3: Usando o CMS

Agora que o banco está seguro e o usuário foi criado:

1. Acesse o CMS através do navegador (Ex: `http://localhost:5500/admin/blog.html` ou pela Vercel `https://uxfetch.com.br/admin/blog.html`).
2. O formulário do CMS estará oculto. Faça login com `tctulio2009@gmail.com` e a senha que você acabou de criar.
3. Crie seus artigos! Ao publicar, eles aparecerão automaticamente na página inicial do site.

Se alguém que não seja você tentar logar ou forçar um post pelo código, o próprio Supabase rejeitará graças às regras de segurança que você aplicou.
