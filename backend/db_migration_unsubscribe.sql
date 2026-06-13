-- Migração: Segurança do Unsubscribe (Token UUID)
-- Execute este script no painel SQL do Supabase (SQL Editor)

-- 1. Adiciona a coluna 'token' na tabela de inscritos.
-- Ela já será preenchida com UUIDs aleatórios para os usuários existentes.
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS token UUID DEFAULT gen_random_uuid();

-- 2. Remove a permissão pública de DELETE (Bloqueio da brecha)
DROP POLICY IF EXISTS "Permitir deleção anônima" ON public.subscribers;

-- 3. Cria a função segura (RPC) para deletar baseado no token secreto
-- O 'SECURITY DEFINER' faz com que a função execute como "Administrador",
-- burlando a ausência da policy de DELETE para quem tiver o token exato.
CREATE OR REPLACE FUNCTION public.unsubscribe_by_token(secret_token UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.subscribers WHERE token = secret_token;
END;
$$;
