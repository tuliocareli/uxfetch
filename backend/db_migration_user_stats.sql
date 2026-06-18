-- Migração: Estatísticas de Usuários
-- Execute este script no painel SQL do Supabase (SQL Editor)

-- 1. Adiciona as colunas na tabela platform_stats
ALTER TABLE public.platform_stats ADD COLUMN IF NOT EXISTS total_users_lifetime integer DEFAULT 0;
ALTER TABLE public.platform_stats ADD COLUMN IF NOT EXISTS current_users integer DEFAULT 0;

-- 2. Atualiza os valores atuais com base no que existe na base (o usuário disse que a base aumentou para 37)
-- Isso alinha o histórico com a realidade atual
UPDATE public.platform_stats 
SET 
  total_users_lifetime = (SELECT count(*) FROM public.subscribers),
  current_users = (SELECT count(*) FROM public.subscribers)
WHERE id = 1;

-- 3. Criação da função e trigger para manter atualizado automaticamente
CREATE OR REPLACE FUNCTION public.update_user_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.platform_stats 
        SET total_users_lifetime = total_users_lifetime + 1,
            current_users = current_users + 1
        WHERE id = 1;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.platform_stats 
        SET current_users = current_users - 1
        WHERE id = 1;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_user_stats ON public.subscribers;
CREATE TRIGGER trg_update_user_stats
AFTER INSERT OR DELETE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_user_stats();
