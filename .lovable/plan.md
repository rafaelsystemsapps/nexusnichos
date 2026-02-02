

## Plano: Adicionar Card de Lucro

Vou adicionar um quarto card que mostra especificamente o **Lucro** - que só aparece quando o valor é positivo. Quando não houver lucro (valor negativo ou zero), mostrará R$ 0,00.

### O que será feito:

1. **Adicionar novo card "Lucro"** ao lado dos 3 cards existentes:
   - Cor: Verde/dourado para destacar que é o dinheiro que sobra de verdade
   - Ícone: Wallet ou similar para representar "dinheiro no bolso"
   - Lógica: Se `sobra > 0`, mostra o valor. Caso contrário, mostra `R$ 0,00`
   - Label: "Lucro" com descrição "O que sobra pra você"

2. **Ajustar o grid** de 3 para 4 colunas para acomodar o novo card

### Estrutura visual:

| Faturamento | Custos | Sobra/Falta | **Lucro** |
|-------------|--------|-------------|-----------|
| R$ X (verde) | R$ Y (vermelho) | R$ Z (azul/laranja) | R$ W ou R$ 0 (dourado) |

### Detalhes técnicos:

- Arquivo: `src/components/colaborador/CustosAppsTab.tsx`
- Nova variável: `const lucro = sobra > 0 ? sobra : 0`
- Grid atualizado: `md:grid-cols-4`
- Novo card com estilo dourado/amarelo para destacar o lucro real

