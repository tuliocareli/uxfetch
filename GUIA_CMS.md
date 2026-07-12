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
DROP POLICY IF EXISTS "Apenas admin pode inserir" ON blog_posts;
DROP POLICY IF EXISTS "Apenas admin pode atualizar" ON blog_posts;
DROP POLICY IF EXISTS "Apenas admin pode deletar" ON blog_posts;

-- 3. Cria Política de LEITURA (Qualquer pessoa pode ver a home/artigos)
CREATE POLICY "Leitura Publica" 
ON blog_posts FOR SELECT 
USING (true);

-- 4. Cria Políticas de ESCRITA restritas ao seu email original e a nova conta admin
CREATE POLICY "Apenas admin pode inserir" 
ON blog_posts FOR INSERT 
WITH CHECK (auth.email() in ('tctulio2009@gmail.com', 'contato@uxfetch.com.br'));

CREATE POLICY "Apenas admin pode atualizar" 
ON blog_posts FOR UPDATE 
USING (auth.email() in ('tctulio2009@gmail.com', 'contato@uxfetch.com.br'));

CREATE POLICY "Apenas admin pode deletar" 
ON blog_posts FOR DELETE 
USING (auth.email() in ('tctulio2009@gmail.com', 'contato@uxfetch.com.br'));
```

## Passo 2: Criar uma Conta Secundária (Para não afetar a principal)

Para evitar problemas com limite de e-mails ou redirects, e sem precisar deletar a sua conta principal do Google (que tem dados salvos), você pode criar um e-mail secundário **apenas para acessar o CMS**.

1. Acesse o seu projeto no **Supabase Dashboard**.
2. No menu lateral esquerdo, clique em **Authentication**.
3. Na aba **Users**, clique no botão verde **Add User** -> **Create new user**.
4. Insira:
   - **Email:** `contato@uxfetch.com.br` (ou qualquer outro que preferir).
   - **Password:** Escolha uma senha segura e digite-a. (Ela já será salva na hora!)
5. Marque a opção **Auto Confirm User?** para ativar instantaneamente.
6. Clique em **Create User**.

## Passo 3: Usando o CMS

Agora você pode acessar livremente e com tranquilidade:

1. Acesse o CMS através do navegador (Ex: `http://localhost:5500/admin/blog.html`).
2. Faça login com o email secundário que você criou (`contato@uxfetch.com.br`) e a senha que definiu.
3. Se quiser, você ainda pode logar com `tctulio2009@gmail.com` usando essa mesma tela caso configure a senha dele no painel.

Essa abordagem não usa redirecionamentos OAuth e não depende de e-mails do Supabase para funcionar (evitando rate limit). Apenas você tem acesso.

## Passo 4: Boas Práticas para Imagens (SEO e Performance)

O Google avalia a velocidade do seu site (Core Web Vitals) e a acessibilidade das imagens. Para garantir que seu blog ranqueie no topo e carregue na velocidade da luz, siga sempre estas regras ao adicionar imagens no CMS:

### 1. Formato Correto
- **Use .WEBP ou .JPG:** Para fotos, banners e cenários. O formato `.webp` é o nativo do Google e extremamente leve.
- **Evite .PNG:** Só use `.png` se a imagem precisar de fundo transparente ou for um logo vetorizado. PNGs pesam até 10x mais que o necessário.

### 2. Tamanho e Dimensões
- **Redimensione antes de subir:** Não suba imagens gigantes (ex: 4000px).
- **Capa do Artigo:** Ideal entre `1200px` e `1400px` de largura.
- **Imagens do meio do texto:** Ideal em torno de `800px` de largura.
- **Peso Máximo:** Tente deixar todas as imagens com **menos de 250 KB** (idealmente perto de 100 KB).
- *Dica de Ferramenta:* Use o **[Squoosh.app](https://squoosh.app/)** (do Google) ou **[TinyPNG](https://tinypng.com/)** para comprimir as imagens gratuitamente antes de subir pro Imgur ou outro host.

### 3. SEO e Acessibilidade (Alt Text)
- **Alt Text (Texto Alternativo):** É assim que o robô do Google "enxerga" a sua imagem. **Nunca deixe vazio.**
- Em vez de escrever algo genérico, descreva a imagem. *Exemplo ruim:* "foto design". *Exemplo bom:* "Gráfico de barras mostrando que quarta e quinta-feira são os dias com mais vagas de design publicadas".
- **Legenda:** Sempre que possível, adicione uma legenda para contextualizar a imagem para o seu leitor (ajuda a quebrar o bloco de texto longo). No CMS, o modal de inserção de imagens cuida da formatação automática.
