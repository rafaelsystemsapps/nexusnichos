

# Plano: Corrigir erro de build + Alterar senha do admin

## 1. Corrigir erro de build

O arquivo `src/hooks/useAvisoPendencia.ts` usa `NodeJS.Timeout` (linha 18) que não é reconhecido no ambiente Vite/browser. Trocar para `ReturnType<typeof setInterval>`.

**Arquivo:** `src/hooks/useAvisoPendencia.ts`
- Linha 18: `const intervalRef = useRef<NodeJS.Timeout | null>(null)` → `const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)`

## 2. Alterar senha

Após corrigir o build, usarei a edge function `reset-password` já existente para redefinir a senha do admin. Vou precisar que você informe:
- O **email** do usuário admin
- A **nova senha** desejada

