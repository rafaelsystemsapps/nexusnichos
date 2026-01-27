

## Plano: Alterar Senha do Admin Principal

### O que será feito

Alterar a senha da conta admin principal para `Admin@2025` usando a edge function `reset-password` que já existe no sistema.

### Conta a ser atualizada

| Campo | Valor |
|-------|-------|
| **Email** | rafael.workbiz@gmail.com |
| **User ID** | 74c7f7b4-d35e-4b3e-a4ca-18b659a96837 |
| **Nova Senha** | Admin@2025 |

### Como será feito

1. Chamar a edge function `reset-password` com:
   - `user_id`: 74c7f7b4-d35e-4b3e-a4ca-18b659a96837
   - `new_password`: Admin@2025

2. A edge function usa o `service_role_key` para atualizar a senha via `supabase.auth.admin.updateUserById()`

### Resultado

- Senha do admin atualizada imediatamente
- Próximo login usará a nova senha `Admin@2025`

