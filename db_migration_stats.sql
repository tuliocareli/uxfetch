-- 1. Cria a tabela de estatísticas
CREATE TABLE IF NOT EXISTS public.platform_stats (
    id integer PRIMARY KEY DEFAULT 1,
    total_jobs_found integer DEFAULT 0,
    total_emails_sent integer DEFAULT 0
);

-- 2. Insere a linha inicial (se não existir)
INSERT INTO public.platform_stats (id, total_jobs_found, total_emails_sent)
VALUES (1, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- 3. Cria a função (RPC) para incrementar os valores com segurança (evita condição de corrida)
CREATE OR REPLACE FUNCTION public.increment_platform_stats(jobs_added integer, emails_added integer)
RETURNS void AS $$
BEGIN
  UPDATE public.platform_stats
  SET 
    total_jobs_found = total_jobs_found + jobs_added,
    total_emails_sent = total_emails_sent + emails_added
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql;
