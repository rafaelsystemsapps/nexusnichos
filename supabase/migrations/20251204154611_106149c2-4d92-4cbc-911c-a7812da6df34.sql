-- Colaboradores podem atualizar configurações do seu próprio nicho
CREATE POLICY "Colaboradores podem atualizar seu nicho"
  ON public.nichos FOR UPDATE
  USING (
    id = public.get_user_nicho(auth.uid())
  )
  WITH CHECK (
    id = public.get_user_nicho(auth.uid())
  );