
-- Extend contas_redes_sociais
ALTER TABLE public.contas_redes_sociais
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS disabled_at timestamptz,
  ADD COLUMN IF NOT EXISTS banned_at timestamptz;

-- account_routine_items
CREATE TABLE IF NOT EXISTS public.account_routine_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.contas_redes_sociais(id) ON DELETE CASCADE,
  nicho_id uuid NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  completed_at timestamptz,
  "order" int NOT NULL DEFAULT 0,
  recurring boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routine_account ON public.account_routine_items(account_id);

ALTER TABLE public.account_routine_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver itens rotina"
  ON public.account_routine_items FOR SELECT
  USING (has_role(auth.uid(),'admin') OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Criar itens rotina"
  ON public.account_routine_items FOR INSERT
  WITH CHECK (has_role(auth.uid(),'admin') OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Editar itens rotina"
  ON public.account_routine_items FOR UPDATE
  USING (has_role(auth.uid(),'admin') OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Deletar itens rotina"
  ON public.account_routine_items FOR DELETE
  USING (has_role(auth.uid(),'admin') OR nicho_id = get_user_nicho(auth.uid()));

CREATE TRIGGER trg_routine_updated_at
  BEFORE UPDATE ON public.account_routine_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- account_logs
CREATE TABLE IF NOT EXISTS public.account_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.contas_redes_sociais(id) ON DELETE CASCADE,
  nicho_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action_type text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_account_logs_account ON public.account_logs(account_id, created_at DESC);

ALTER TABLE public.account_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver logs conta"
  ON public.account_logs FOR SELECT
  USING (has_role(auth.uid(),'admin') OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Criar logs conta"
  ON public.account_logs FOR INSERT
  WITH CHECK (user_id = auth.uid() AND (has_role(auth.uid(),'admin') OR nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Deletar logs conta"
  ON public.account_logs FOR DELETE
  USING (has_role(auth.uid(),'admin') OR nicho_id = get_user_nicho(auth.uid()));
