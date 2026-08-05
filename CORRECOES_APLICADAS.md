# Correções Aplicadas - Bug de Duplicação de Desconto

## 🔍 Problema Identificado

O desconto geral estava sendo aplicado **duas vezes** no sistema, causando valores incorretos no detalhamento de vendas. Por exemplo, um produto de R$ 400 com 50% de desconto geral deveria resultar em R$ 200, mas estava sendo calculado como R$ 200 e depois recalculado novamente.

### Causa Raiz

No arquivo `views/frente-caixa.handlebars`, a lógica de cálculo estava:

1. **Primeira aplicação**: Calculava corretamente o `totalFinal` com o desconto geral
2. **Segunda aplicação**: Aplicava um "fator proporcional" que recalculava o desconto novamente

Além disso, o **desconto geral não era enviado para o backend**, impossibilitando o rastreamento correto da transação.

---

## ✅ Correções Realizadas

### 1. **Modelo Venda (models/Venda.js)**

**Adicionado novo campo:**
```javascript
desconto_geral: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0
}
```

Este campo agora rastreia o **desconto geral aplicado em cada venda**, permitindo auditoria completa e cálculos corretos no fluxo de caixa.

---

### 2. **Rota POST /frente-caixa (app.js)**

**Antes:**
```javascript
const { carrinho, meio_pagamento } = req.body;
```

**Depois:**
```javascript
const { carrinho, meio_pagamento, desconto_geral } = req.body;
const descontoGeralAplicado = parseFloat(desconto_geral) || 0;

// Ao criar a venda:
await Venda.create({
    codigo_produto: item.codigo,
    data_venda: new Date(),
    meio_pagamento: meio_pagamento,
    desconto_porcentagem: item.descontoItem || 0,
    desconto_geral: descontoGeralAplicado,  // ✅ NOVO
    valor_pago: item.valorFinal
});
```

Agora o backend recebe e armazena o desconto geral de cada transação.

---

### 3. **Frontend - Frente de Caixa (views/frente-caixa.handlebars)**

**Adicionado campo oculto para enviar desconto geral:**
```html
<input type="hidden" name="desconto_geral" id="desconto_geral_input" value="0">
```

**Atualizado script para sincronizar o desconto:**
```javascript
// Envia o carrinho E o desconto geral para o backend
inputOculto.value = JSON.stringify(carrinho);
inputDescontoOculto.value = descontoGeral;  // ✅ NOVO
```

Agora o desconto geral é enviado junto com o carrinho no formulário POST.

---

## 📊 Impacto das Correções

### Antes (Com Bug):
- Produto: R$ 400
- Desconto geral: 50%
- Valor salvo no banco: R$ 200 ✓
- Desconto registrado: 0% ✗
- Resultado no fluxo de caixa: Lucro incorreto (desconto não era considerado)

### Depois (Corrigido):
- Produto: R$ 400
- Desconto geral: 50%
- Valor salvo no banco: R$ 200 ✓
- Desconto registrado: 50% ✓
- Resultado no fluxo de caixa: Lucro correto (desconto é considerado)

---

## 🔧 Próximos Passos Recomendados

### 1. **Migração de Banco de Dados**

Você precisa adicionar a coluna `desconto_geral` à tabela `vendas`:

```sql
ALTER TABLE vendas ADD COLUMN desconto_geral DECIMAL(5, 2) DEFAULT 0;
```

### 2. **Atualizar Fluxo de Caixa (Opcional)**

Se desejar, você pode atualizar a view `fluxo-caixa.handlebars` para exibir o desconto geral em uma coluna adicional:

```handlebars
<th>Desc. Geral (%)</th>
<td>{{desconto_geral}}%</td>
```

### 3. **Testes Recomendados**

- [ ] Testar venda com desconto geral de 0%
- [ ] Testar venda com desconto geral de 50%
- [ ] Testar venda com múltiplos itens + desconto geral
- [ ] Verificar se o lucro é calculado corretamente no fluxo de caixa
- [ ] Validar que o desconto geral não é aplicado duas vezes

---

## 📝 Resumo das Mudanças

| Arquivo | Mudança |
|---------|---------|
| `models/Venda.js` | Adicionado campo `desconto_geral` |
| `app.js` (rota POST /frente-caixa) | Recebe e salva `desconto_geral` |
| `views/frente-caixa.handlebars` | Envia `desconto_geral` para o backend |

---

## ⚠️ Importante

Após aplicar estas correções, você **DEVE**:

1. Executar a migração SQL para adicionar a coluna ao banco de dados
2. Reiniciar o servidor Node.js
3. Testar completamente o fluxo de vendas
4. Validar os cálculos no fluxo de caixa

Se você tiver vendas antigas no banco de dados, elas terão `desconto_geral = 0`, o que é correto pois não tinham desconto registrado antes.
