-- 1. Adicionar work_mode na tabela jobs
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS work_mode text DEFAULT 'in_person';

-- 2. Adicionar accepts_hybrid na tabela subscribers
ALTER TABLE public.subscribers ADD COLUMN IF NOT EXISTS accepts_hybrid boolean DEFAULT true;
