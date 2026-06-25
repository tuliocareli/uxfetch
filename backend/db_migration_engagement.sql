-- Migração: Rastreio de Engajamento para Frequência Inteligente (Sunset Policy)
-- Execute este script no painel SQL do Supabase (SQL Editor)

-- 1. Adiciona a coluna para registrar a data e hora da última abertura de e-mail
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP WITH TIME ZONE;

-- (Opcional, mas útil) Setar a data atual como last_opened_at para usuários existentes,
-- assim a contagem dos 15 dias começa a partir de hoje para quem já estava na base, 
-- evitando que todos sejam considerados inativos logo no primeiro dia de implantação.
UPDATE public.subscribers 
SET last_opened_at = created_at
WHERE last_opened_at IS NULL;
