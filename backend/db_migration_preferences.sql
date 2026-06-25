-- 1. Adiciona a coluna preferred_roles
-- Ela vai guardar um array de texto com as áreas selecionadas.
-- Definimos um DEFAULT no banco de dados para segurança, garantindo que qualquer insert cru
-- via API que não mande a coluna caia no escopo restrito do UX Fetch.
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS preferred_roles text[] DEFAULT '{"ux_ui", "leadership"}';

-- Atualiza toda a base antiga para o novo padrão de segurança
UPDATE subscribers 
SET preferred_roles = '{"ux_ui", "leadership"}' 
WHERE preferred_roles IS NULL;

-- 2. Adiciona a coluna preferred_seniorities
-- Mesma lógica, mas para as senioridades. O default é receber todas as senioridades.
ALTER TABLE subscribers 
ADD COLUMN IF NOT EXISTS preferred_seniorities text[] DEFAULT '{"junior", "pleno", "senior", "especialista"}';

-- Atualiza a base antiga
UPDATE subscribers 
SET preferred_seniorities = '{"junior", "pleno", "senior", "especialista"}' 
WHERE preferred_seniorities IS NULL;
