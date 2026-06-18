-- Migração: Correções de Segurança (Linter do Supabase)
-- Execute este script no painel SQL do Supabase (SQL Editor)

-- 1. Corrige o aviso 'function_search_path_mutable'
-- Adiciona um search_path estrito para evitar sequestro de search_path
ALTER FUNCTION public.increment_platform_stats(integer, integer) SET search_path = public;
ALTER FUNCTION public.unsubscribe_by_token(UUID) SET search_path = public;
ALTER FUNCTION public.update_user_stats() SET search_path = public;

-- 2. Corrige o aviso 'anon_security_definer_function_executable' para a Trigger
-- A trigger de stats não deve ser executável manualmente via API por ninguém.
REVOKE EXECUTE ON FUNCTION public.update_user_stats() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_user_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_user_stats() FROM authenticated;
