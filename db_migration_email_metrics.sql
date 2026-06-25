-- Criação da tabela de métricas históricas de e-mail
CREATE TABLE IF NOT EXISTS public.email_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    event_type TEXT NOT NULL,
    email_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ativar RLS (Row Level Security) para proteger os dados
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Por segurança, nenhuma política pública é criada.
-- Isso significa que nenhuma requisição anônima ou de usuário logado (front-end) pode ler ou escrever.
-- Somente a Edge Function (usando a Service Role Key) conseguirá inserir dados, pois ela bypassa o RLS.

-- Índices de performance para relatórios futuros
CREATE INDEX IF NOT EXISTS idx_email_events_type ON public.email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON public.email_events(created_at);
CREATE INDEX IF NOT EXISTS idx_email_events_email ON public.email_events(email);
