-- Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'colaborador');

-- Criar enum para status de conteúdo
CREATE TYPE public.status_conteudo AS ENUM ('planejado', 'em_producao', 'publicado');

-- Criar enum para tipo de mídia
CREATE TYPE public.tipo_midia AS ENUM ('video', 'imagem', 'carrossel', 'texto');

-- Criar enum para plataforma de rede social
CREATE TYPE public.plataforma_social AS ENUM ('tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'linkedin', 'outros');

-- Criar enum para status de conta de rede social
CREATE TYPE public.status_conta AS ENUM ('ativa', 'pausada', 'banida', 'limitada');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT now(),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de roles de usuários (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Tabela de nichos
CREATE TABLE public.nichos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  descricao TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de relação usuário-nicho (colaborador pertence a apenas 1 nicho)
CREATE TABLE public.user_nichos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nicho_id UUID REFERENCES public.nichos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de conteúdos planejados
CREATE TABLE public.conteudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_postagem DATE NOT NULL,
  canal plataforma_social NOT NULL,
  tipo_midia tipo_midia NOT NULL,
  status status_conteudo DEFAULT 'planejado',
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  nicho_id UUID REFERENCES public.nichos(id) ON DELETE CASCADE NOT NULL,
  anexo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de contas de redes sociais
CREATE TABLE public.contas_redes_sociais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id UUID REFERENCES public.nichos(id) ON DELETE CASCADE NOT NULL,
  plataforma plataforma_social NOT NULL,
  nome_conta TEXT NOT NULL,
  url_conta TEXT,
  status status_conta DEFAULT 'ativa',
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  observacoes TEXT,
  data_criacao_conta DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_nichos_updated_at BEFORE UPDATE ON public.nichos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_conteudos_updated_at BEFORE UPDATE ON public.conteudos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contas_updated_at BEFORE UPDATE ON public.contas_redes_sociais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar profile automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar profile ao criar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função security definer para verificar se usuário tem role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função security definer para pegar nicho do usuário
CREATE OR REPLACE FUNCTION public.get_user_nicho(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT nicho_id
  FROM public.user_nichos
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nichos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_nichos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contas_redes_sociais ENABLE ROW LEVEL SECURITY;

-- RLS Policies para PROFILES
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins podem atualizar qualquer perfil"
  ON public.profiles FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem inserir perfis"
  ON public.profiles FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para USER_ROLES
CREATE POLICY "Usuários podem ver suas próprias roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todas as roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem gerenciar roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para NICHOS
CREATE POLICY "Colaboradores podem ver seu nicho"
  ON public.nichos FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR
    id = public.get_user_nicho(auth.uid())
  );

CREATE POLICY "Admins podem gerenciar nichos"
  ON public.nichos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para USER_NICHOS
CREATE POLICY "Usuários podem ver sua relação de nicho"
  ON public.user_nichos FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins podem gerenciar relações de nicho"
  ON public.user_nichos FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para CONTEUDOS
CREATE POLICY "Colaboradores podem ver conteúdos de seu nicho"
  ON public.conteudos FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR
    nicho_id = public.get_user_nicho(auth.uid())
  );

CREATE POLICY "Colaboradores podem criar conteúdos em seu nicho"
  ON public.conteudos FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    nicho_id = public.get_user_nicho(auth.uid())
  );

CREATE POLICY "Colaboradores podem atualizar conteúdos de seu nicho"
  ON public.conteudos FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    nicho_id = public.get_user_nicho(auth.uid())
  );

CREATE POLICY "Admins podem deletar qualquer conteúdo"
  ON public.conteudos FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies para CONTAS_REDES_SOCIAIS
CREATE POLICY "Colaboradores podem ver contas de seu nicho"
  ON public.contas_redes_sociais FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR
    nicho_id = public.get_user_nicho(auth.uid())
  );

CREATE POLICY "Colaboradores podem criar contas em seu nicho"
  ON public.contas_redes_sociais FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    nicho_id = public.get_user_nicho(auth.uid())
  );

CREATE POLICY "Colaboradores podem atualizar contas de seu nicho"
  ON public.contas_redes_sociais FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    nicho_id = public.get_user_nicho(auth.uid())
  );

CREATE POLICY "Somente admins podem deletar contas"
  ON public.contas_redes_sociais FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));