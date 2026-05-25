
CREATE TABLE public.app_lab_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  app_type text NOT NULL CHECK (app_type IN ('b2b','b2c')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('active','inactive','pending')),
  country text DEFAULT 'BR',
  description text,
  login_email text,
  password text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_lab_clients_nicho ON public.app_lab_clients(nicho_id);

ALTER TABLE public.app_lab_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver clientes applab" ON public.app_lab_clients FOR SELECT
USING (has_role(auth.uid(),'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Criar clientes applab" ON public.app_lab_clients FOR INSERT
WITH CHECK (user_id = auth.uid() AND (has_role(auth.uid(),'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Editar clientes applab" ON public.app_lab_clients FOR UPDATE
USING (has_role(auth.uid(),'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Deletar clientes applab" ON public.app_lab_clients FOR DELETE
USING (has_role(auth.uid(),'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE TRIGGER trg_app_lab_clients_updated_at
BEFORE UPDATE ON public.app_lab_clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


CREATE TABLE public.app_lab_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL UNIQUE REFERENCES public.app_lab_clients(id) ON DELETE CASCADE,
  nicho_id uuid NOT NULL,
  monthly_value numeric(12,2),
  due_date date,
  next_payment date,
  plan text,
  billing_status text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_lab_billing_client ON public.app_lab_billing(client_id);

ALTER TABLE public.app_lab_billing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver billing applab" ON public.app_lab_billing FOR SELECT
USING (has_role(auth.uid(),'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Criar billing applab" ON public.app_lab_billing FOR INSERT
WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Editar billing applab" ON public.app_lab_billing FOR UPDATE
USING (has_role(auth.uid(),'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Deletar billing applab" ON public.app_lab_billing FOR DELETE
USING (has_role(auth.uid(),'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE TRIGGER trg_app_lab_billing_updated_at
BEFORE UPDATE ON public.app_lab_billing
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
