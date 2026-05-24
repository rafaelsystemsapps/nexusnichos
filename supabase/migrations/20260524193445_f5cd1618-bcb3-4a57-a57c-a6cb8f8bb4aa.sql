
CREATE TABLE public.planner_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  nicho_id uuid NOT NULL,
  title text,
  description text,
  status text NOT NULL DEFAULT 'pendente',
  due_day date NOT NULL DEFAULT CURRENT_DATE,
  horario time,
  completed_at timestamptz,
  recovered_from uuid,
  is_recovered boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.planner_notes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_planner_notes_nicho_day ON public.planner_notes(nicho_id, due_day);
CREATE INDEX idx_planner_notes_nicho_status_day ON public.planner_notes(nicho_id, status, due_day);

CREATE POLICY "Ver notas do nicho"
ON public.planner_notes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Criar notas no nicho"
ON public.planner_notes FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()))
);

CREATE POLICY "Editar notas do nicho"
ON public.planner_notes FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Deletar notas do nicho"
ON public.planner_notes FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE TRIGGER planner_notes_updated_at
BEFORE UPDATE ON public.planner_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
