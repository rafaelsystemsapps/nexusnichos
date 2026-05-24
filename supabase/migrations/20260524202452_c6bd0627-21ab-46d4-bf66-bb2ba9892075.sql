CREATE TABLE public.account_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL,
  nicho_id uuid NOT NULL,
  user_id uuid NOT NULL,
  task_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_account_tasks_account ON public.account_tasks(account_id);

ALTER TABLE public.account_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver tasks conta" ON public.account_tasks FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));
CREATE POLICY "Criar tasks conta" ON public.account_tasks FOR INSERT
WITH CHECK (user_id = auth.uid() AND (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid())));
CREATE POLICY "Editar tasks conta" ON public.account_tasks FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));
CREATE POLICY "Deletar tasks conta" ON public.account_tasks FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE TRIGGER trg_account_tasks_updated_at
BEFORE UPDATE ON public.account_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.account_task_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  account_id uuid NOT NULL,
  nicho_id uuid NOT NULL,
  week_reference date NOT NULL,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, week_reference, weekday)
);

CREATE INDEX idx_account_task_days_task_week ON public.account_task_days(task_id, week_reference);
CREATE INDEX idx_account_task_days_account ON public.account_task_days(account_id);

ALTER TABLE public.account_task_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver task days" ON public.account_task_days FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));
CREATE POLICY "Criar task days" ON public.account_task_days FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));
CREATE POLICY "Editar task days" ON public.account_task_days FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));
CREATE POLICY "Deletar task days" ON public.account_task_days FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE TRIGGER trg_account_task_days_updated_at
BEFORE UPDATE ON public.account_task_days
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();