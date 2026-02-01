

## Plano: Adicionar Campo de Mapa Mental do Cliente

### Resumo

Adicionar um campo `mapa_mental_url` na tabela `clientes` e na interface (formulario + card) para que cada cliente tenha seu proprio link de mapa mental, visivel e clicavel no card.

---

### 1. Migracao de Banco de Dados

Adicionar coluna `mapa_mental_url` na tabela `clientes`:

```sql
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS mapa_mental_url text NULL;
```

---

### 2. Modificacoes no ClienteForm.tsx

Adicionar campo na secao "Links Rapidos":

```text
┌─────────────────────────────────────────────────────────────┐
│  Links Rapidos                                              │
├─────────────────────────────────────────────────────────────┤
│  [Instagram URL *]          [TikTok URL]                    │
│  [Outro Link Label]         [Outro Link URL]                │
│  [Link Principal]                                           │
│  [Mapa Mental URL] ← NOVO                                   │
└─────────────────────────────────────────────────────────────┘
```

**Mudancas:**
- Adicionar `mapa_mental_url` ao estado `formData`
- Adicionar campo Input com placeholder "https://tldraw.com/..." ou "https://docs.google.com/..."
- Incluir no payload de salvamento

---

### 3. Modificacoes no ClienteCard.tsx

Adicionar botao/link visivel na area de "Links Rapidos" do card:

```text
┌─────────────────────────────────────────────────────────────┐
│  [📸 Instagram] [🎵 TikTok] [🔗 Outro] [🔗 Principal]       │
│  [🧠 Mapa Mental] ← NOVO - botao destacado                  │
└─────────────────────────────────────────────────────────────┘
```

**Caracteristicas:**
- Icone: Brain ou Map (Lucide)
- Cor: Roxo/Violeta para destacar
- Texto: "Mapa Mental"
- Abre em nova aba com `noopener,noreferrer`

---

### Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `supabase/migrations/` | Adicionar coluna `mapa_mental_url` |
| `src/components/colaborador/ClienteForm.tsx` | Adicionar campo no formulario |
| `src/components/colaborador/ClienteCard.tsx` | Exibir botao de acesso ao mapa |

---

### Resultado Visual no Card

O card do cliente tera um novo botao na linha de links:

```
[Instagram] [TikTok] [Link] [🧠 Mapa Mental]
```

Ao clicar, abre a URL do mapa mental em nova aba.

---

### Criterios de Aceite

1. Campo "Mapa Mental URL" aparece no formulario de cliente (opcional)
2. Se preenchido, botao "Mapa Mental" aparece no card do cliente
3. Ao clicar no botao, abre a URL em nova aba
4. URL e salva e carregada corretamente no banco

