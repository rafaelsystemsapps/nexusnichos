-- Add categoria column to client_apps table
ALTER TABLE client_apps 
ADD COLUMN categoria TEXT NOT NULL DEFAULT 'dominio';

-- Add comment for documentation
COMMENT ON COLUMN client_apps.categoria IS 'Tipo de custo: dominio, assinatura, licenca, outro';