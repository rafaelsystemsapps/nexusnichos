-- Create offer_vault table
CREATE TABLE public.offer_vault (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nicho_id UUID NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  titulo_curto TEXT NOT NULL,
  origem_plataforma TEXT NOT NULL DEFAULT 'tiktok',
  origem_url TEXT,
  pais TEXT NOT NULL DEFAULT 'BR',
  status_oferta TEXT NOT NULL DEFAULT 'salva',
  como_testar TEXT,
  aprendizado TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.offer_vault ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Colaboradores podem ver ofertas do seu nicho"
ON public.offer_vault FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar ofertas no seu nicho"
ON public.offer_vault FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem editar ofertas do seu nicho"
ON public.offer_vault FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar ofertas do seu nicho"
ON public.offer_vault FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- Add updated_at trigger
CREATE TRIGGER update_offer_vault_updated_at
BEFORE UPDATE ON public.offer_vault
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add offer_vault_habilitado column to nichos table
ALTER TABLE public.nichos ADD COLUMN offer_vault_habilitado BOOLEAN NOT NULL DEFAULT false;