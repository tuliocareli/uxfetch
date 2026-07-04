-- ============================================================
-- Migração de Segurança: unsubscribes_feedback + Rate Limiting
-- Execute no SQL Editor do Supabase
-- Julho 2026
-- ============================================================

-- 1. Garante que RLS está ativo na tabela de feedback
ALTER TABLE public.unsubscribes_feedback ENABLE ROW LEVEL SECURITY;

-- 2. Remove qualquer política permissiva existente antes de criar a nova
DROP POLICY IF EXISTS "Allow anon insert feedback" ON public.unsubscribes_feedback;

-- 3. Cria política de INSERT com limite de tamanho no reason
--    - Permite insert público (anon), mas apenas se o campo reason for curto (ou nulo)
--    - Isso bloqueia tentativas de inserir payloads gigantes via curl/Postman
CREATE POLICY "Allow anon insert feedback with size limit"
  ON public.unsubscribes_feedback
  FOR INSERT
  TO anon
  WITH CHECK (
    reason IS NULL OR char_length(reason) <= 500
  );

-- 4. Sem SELECT público na tabela de feedback (seus feedbacks são privados)
--    A service role ainda consegue ler tudo normalmente.
DROP POLICY IF EXISTS "Allow public read feedback" ON public.unsubscribes_feedback;
-- (não cria política de SELECT para anon — padrão já é negar)

-- ============================================================
-- RATE LIMITING (não é SQL — configurar no painel do Supabase)
-- ============================================================
-- Acesse: Supabase Dashboard > seu projeto > Edge Functions
-- Para cada função (subscribe, update_preferences), configure:
--   - Rate Limit: 20 requests / minuto por IP
-- Isso evita que um script tente cadastros ou adivinhações em loop.
-- ============================================================
