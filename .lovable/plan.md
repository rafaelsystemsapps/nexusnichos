
## Plano: Adicionar Campo Mapa Mental URL no Formulario de App do Cliente

### Contexto

O campo "Mapa Mental URL" foi adicionado anteriormente ao formulario de **Cliente** (ClienteForm.tsx). Porem, voce quer que esse campo apareca no formulario de **App do Cliente** (ClienteAppForm.tsx) - o formulario que adiciona apps/servicos vinculados ao cliente.

---

### O Que Sera Feito

#### 1. Migracao de Banco de Dados

Adicionar coluna `mapa_mental_url` na tabela `client_apps`:

```sql
ALTER TABLE client_apps ADD COLUMN IF NOT EXISTS mapa_mental_url text NULL;
```

---

#### 2. Modificacoes no ClienteAppForm.tsx

Adicionar campo no formulario:

```text
┌─────────────────────────────────────────────────────────────┐
│  Adicionar App                                              │
├─────────────────────────────────────────────────────────────┤
│  [Nome do App/Servico *]                                    │
│  [Tipo de Custo]        [Valor (R$)]                        │
│  [Periodicidade]        [Rateio]                            │
│  [Mapa Mental URL] ← NOVO                                   │
│  [Observacao (opcional)]                                    │
│  [Ativo - Switch]                                           │
└─────────────────────────────────────────────────────────────┘
```

**Mudancas:**
- Adicionar `mapa_mental_url` ao schema Zod de validacao
- Adicionar campo Input com placeholder "https://tldraw.com/..."
- Incluir no payload de criacao/atualizacao

---

#### 3. Modificacoes no ClienteAppItem.tsx

Exibir botao para acessar o mapa mental se a URL existir:

```text
┌─────────────────────────────────────────────────────────────┐
│  📱 Lovable Pro - R$ 100/mes         [🧠] [✏️] [🗑️]        │
└─────────────────────────────────────────────────────────────┘
```

- Icone Brain (🧠) que abre a URL em nova aba
- Cor violeta para destacar

---

### Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/` | Adicionar coluna `mapa_mental_url` em `client_apps` |
| `src/components/colaborador/ClienteAppForm.tsx` | Adicionar campo no formulario |
| `src/components/colaborador/ClienteAppItem.tsx` | Exibir botao de acesso ao mapa |
| `src/hooks/queries/useClienteApps.ts` | Atualizar tipos se necessario |

---

### Criterios de Aceite

1. Campo "Mapa Mental URL" aparece no formulario de App do cliente (opcional)
2. Se preenchido, icone de mapa mental aparece no item do app
3. Ao clicar no icone, abre a URL em nova aba
4. URL e salva e carregada corretamente no banco

