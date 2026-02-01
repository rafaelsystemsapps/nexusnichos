

## Plano: Aba "Projeto" - Visão do Workspace com Card Mapa Mental

### Resumo

Criar uma nova aba fixa "Projeto" como **primeira aba** do workspace colaborador. Essa aba servirá como Home do workspace, contendo inicialmente um Card "Mapa Mental" que permite configurar e acessar um link externo (Tldraw, Google Docs ou Miro). A estrutura é escalável para futuros cards (Briefing, Drive, CRM, etc.).

---

### Modelo de Dados

#### Nova Tabela: `workspace_links`

```sql
CREATE TABLE workspace_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id uuid NOT NULL REFERENCES nichos(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text,
  title text NOT NULL DEFAULT 'Link',
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(nicho_id, type)
);

-- Trigger para updated_at
CREATE TRIGGER workspace_links_updated_at
  BEFORE UPDATE ON workspace_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | uuid | Identificador unico |
| `nicho_id` | uuid | FK para nichos |
| `type` | text | Tipo do link: `mindmap`, `briefing`, `drive`, etc. |
| `provider` | text | Provedor: `tldraw`, `docs`, `miro` |
| `title` | text | Titulo do card |
| `url` | text | URL do link externo |

A constraint `UNIQUE(nicho_id, type)` garante apenas 1 link de cada tipo por nicho.

---

### Seguranca (RLS)

```sql
ALTER TABLE workspace_links ENABLE ROW LEVEL SECURITY;

-- SELECT: Colaboradores podem ver links do seu nicho
CREATE POLICY "Colaboradores podem ver links do seu nicho"
ON workspace_links FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR nicho_id = get_user_nicho(auth.uid())
);

-- INSERT: Colaboradores podem criar links no seu nicho
CREATE POLICY "Colaboradores podem criar links no seu nicho"
ON workspace_links FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR nicho_id = get_user_nicho(auth.uid())
);

-- UPDATE: Colaboradores podem editar links do seu nicho
CREATE POLICY "Colaboradores podem editar links do seu nicho"
ON workspace_links FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR nicho_id = get_user_nicho(auth.uid())
);

-- DELETE: Colaboradores podem deletar links do seu nicho
CREATE POLICY "Colaboradores podem deletar links do seu nicho"
ON workspace_links FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR nicho_id = get_user_nicho(auth.uid())
);
```

---

### Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/colaborador/ProjetoTab.tsx` | **CRIAR** | Componente principal da aba Projeto |
| `src/hooks/queries/useWorkspaceLinks.ts` | **CRIAR** | Hook para buscar/upsert links |
| `src/hooks/queries/index.ts` | **MODIFICAR** | Exportar novo hook |
| `src/pages/ColaboradorWorkspace.tsx` | **MODIFICAR** | Adicionar rota "projeto" como primeira |
| `src/components/layout/AppSidebar.tsx` | **MODIFICAR** | Adicionar "Projeto" como primeira aba fixa |
| `src/components/colaborador/OrdemAbasEditor.tsx` | **MODIFICAR** | Adicionar "projeto" como item fixo |
| `src/components/colaborador/ConfiguracoesNichoTab.tsx` | **MODIFICAR** | Adicionar secao "Mapa Mental" |

---

### Componente: ProjetoTab.tsx

```text
┌─────────────────────────────────────────────────────────────┐
│  Projeto                                                    │
│  Visao geral e links principais do workspace                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🧠 Mapa Mental                                     │    │
│  │                                                     │    │
│  │  [ESTADO VAZIO]                                     │    │
│  │  Configure o mapa mental do projeto                 │    │
│  │                                                     │    │
│  │  Provedor: [Tldraw ▼]                               │    │
│  │  URL: [_____________________________]               │    │
│  │                                                     │    │
│  │  [Salvar]                                           │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🧠 Mapa Mental                          [Miro]     │    │
│  │                                                     │    │
│  │  [ESTADO CONFIGURADO]                               │    │
│  │  miro.com/app/board/xyz...                          │    │
│  │                                                     │    │
│  │  [Abrir]  [Editar]  [Remover]                       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Estados do Card:**

1. **Vazio**: Select de provedor + Input de URL + Botao Salvar
2. **Configurado**: Badge do provider, URL truncada, botoes Abrir/Editar/Remover
3. **Editando**: Formulario com valores atuais

**Provedores disponiveis:**
- `tldraw` - Tldraw
- `docs` - Google Docs  
- `miro` - Miro

---

### Hook: useWorkspaceLinks.ts

```typescript
// Buscar link por tipo
export function useWorkspaceLink(nichoId: string, type: string) {
  return useQuery({
    queryKey: ["workspace-link", nichoId, type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_links")
        .select("*")
        .eq("nicho_id", nichoId)
        .eq("type", type)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!nichoId && !!type,
  });
}

// Upsert link (cria ou atualiza)
export function useUpsertWorkspaceLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      nicho_id: string;
      type: string;
      provider: string;
      title: string;
      url: string;
    }) => {
      const { error } = await supabase
        .from("workspace_links")
        .upsert(data, { 
          onConflict: "nicho_id,type",
          ignoreDuplicates: false 
        });
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["workspace-link", variables.nicho_id, variables.type] 
      });
    },
  });
}

// Deletar link
export function useDeleteWorkspaceLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ nichoId, type }: { nichoId: string; type: string }) => {
      const { error } = await supabase
        .from("workspace_links")
        .delete()
        .eq("nicho_id", nichoId)
        .eq("type", type);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["workspace-link", variables.nichoId, variables.type] 
      });
    },
  });
}
```

---

### Modificacoes na Navegacao

#### AppSidebar.tsx

**Adicionar no DEFAULT_ORDER (primeiro item):**
```typescript
const DEFAULT_ORDER = [
  "projeto",  // NOVA - primeira posicao
  "contas",
  "logistica",
  // ...resto
];
```

**Adicionar no abaConfig:**
```typescript
projeto: { 
  title: "Projeto", 
  href: `/workspace/${nichoId}`, // rota raiz
  icon: FolderKanban, // ou Target
  enabled: true // sempre habilitado
},
```

#### OrdemAbasEditor.tsx

**Adicionar como item fixo:**
```typescript
const fixedItems = ["projeto", "configuracoes"];

// Remover "dashboard" das referencias (ja foi removido anteriormente)
```

**Adicionar no ABA_CONFIG:**
```typescript
projeto: { title: "Projeto", icon: FolderKanban },
```

---

### Modificacoes no ColaboradorWorkspace.tsx

**Atualizar getPageTitle():**
```typescript
if (!subPath || subPath === "" || subPath === "projeto") return "Projeto";
```

**Atualizar renderContent():**
```typescript
// Rota raiz agora mostra ProjetoTab
if (!subPath || subPath === "" || subPath === "projeto") {
  return <ProjetoTab nichoId={nichoId!} />;
}
```

---

### Secao nas Configuracoes do Nicho

Adicionar uma secao "Links do Projeto" no `ConfiguracoesNichoTab.tsx`:

```text
┌─────────────────────────────────────────────────────────────┐
│  Links do Projeto                                           │
│  Configure os links externos do workspace                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🧠 Mapa Mental                                             │
│  Provedor: [Miro ▼]                                         │
│  URL: [https://miro.com/app/board/xyz]                      │
│  [Salvar]                                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### Validacoes

1. **URL obrigatoria** - nao pode estar vazia
2. **Formato valido** - deve comecar com `http://` ou `https://`
3. **Provider obrigatorio** - deve selecionar um provedor

```typescript
const validateUrl = (url: string): boolean => {
  return url.startsWith("http://") || url.startsWith("https://");
};
```

---

### Fluxo de Dados

```text
Colaborador acessa /workspace/{nichoId}
           │
           ▼
    ProjetoTab carrega
           │
           ▼
    useWorkspaceLink(nichoId, "mindmap")
           │
           ├── null → Estado Vazio (formulario)
           │
           └── data → Estado Configurado
                       │
                       ├── Abrir → window.open(url, "_blank", "noopener,noreferrer")
                       │
                       ├── Editar → mostrar formulario com valores
                       │
                       └── Remover → confirm + delete
```

---

### Criterios de Aceite

1. Ao entrar em `/workspace/{id}`, a primeira aba e "Projeto"
2. Se nao houver mapa mental, aparece estado vazio com select + input
3. Ao salvar, fica persistido no banco e ao recarregar continua
4. Ao clicar em "Abrir", abre a URL em nova aba com seguranca (`noopener,noreferrer`)
5. URL pode ser alterada na propria pagina Projeto e tambem nas Configuracoes
6. Usuario de outro nicho nao consegue ver/editar link (RLS funcionando)
7. Sidebar sempre mostra "Projeto" como primeira aba (fixo, nao desabilitavel)
8. Formulario valida URL (obrigatoria, formato http/https)
9. Toast de feedback apos salvar/remover

---

### Icones Sugeridos

```typescript
import { 
  FolderKanban, // Para aba "Projeto"
  Brain,        // Para card "Mapa Mental"
  ExternalLink, // Para botao "Abrir"
  Pencil,       // Para botao "Editar"
  Trash2,       // Para botao "Remover"
} from "lucide-react";
```

---

### Extensibilidade Futura

A tabela `workspace_links` e estrutura de componentes permitem adicionar facilmente novos cards:

| type | title | Uso |
|------|-------|-----|
| `mindmap` | Mapa Mental | Link para mapa visual |
| `briefing` | Briefing | Documento de briefing |
| `drive` | Drive | Pasta compartilhada |
| `sop` | SOPs | Procedimentos operacionais |
| `crm` | CRM | Sistema de CRM |

Para adicionar um novo card, basta:
1. Criar componente do card seguindo o padrao
2. Adicionar na `ProjetoTab`
3. Usar `useWorkspaceLink(nichoId, "novo_tipo")`

