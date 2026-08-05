# 🆕 Funções Novas Implementadas no Back-end

Este documento resume tudo que foi adicionado/corrigido no back-end, mantendo 100% a paleta de cores e o design "Ateliê" já existente.

---

## 1. Módulo de Clientes (completo, do zero)

O módulo já existia parcialmente no código (`clienteController.js`, `clienteRoutes.js`), mas estava **quebrado e desconectado**:
- A rota nunca era carregada no `app.js`.
- O controller usava `db.query(...)` no estilo `mysql2`, mas `db.js` exporta uma instância do **Sequelize**, que não tem esse método — ia quebrar na hora de usar.
- Não existia model `Cliente`, nem views, nem menu.

**O que foi feito:**
- Novo model `models/Cliente.js` (nome, telefone, cpf, limite_credito, saldo_devedor).
- Controller reescrito com Sequelize: listar, cadastrar, editar, excluir, registrar pagamento e API de busca.
- Views novas: `clientes.handlebars` (lista + busca + baixa de pagamento), `cadastrar-cliente.handlebars`, `editar-cliente.handlebars`.
- Rotas conectadas corretamente em `app.js`.
- Link "Clientes" no menu lateral.

### Venda Fiado (compra a prazo)
- Na Frente de Caixa, a opção **"Fiado (a prazo)"** foi adicionada ao meio de pagamento.
- Ao selecioná-la, aparece um campo de busca de cliente (autocomplete via `/api/clientes`).
- O sistema **valida o limite de crédito disponível** (`limite_credito - saldo_devedor`) antes de permitir a venda.
- Ao finalizar, o valor da compra é somado ao `saldo_devedor` do cliente.
- Na tela de Clientes, o botão **"Receber"** permite dar baixa (parcial ou total) na dívida.

---

## 2. Estoque — Cor, Quantidade e Edição de Produto

- Novos campos **Cor** e **Quantidade** no cadastro e na listagem de produtos.
- Nova tela de **edição de produto** (antes só existia cadastrar e excluir).
- A venda agora **decrementa a quantidade em estoque** a cada unidade vendida; o produto só vira "vendido" quando a quantidade chega a zero.
- A devolução **incrementa a quantidade de volta** ao estoque.

---

## 3. Fluxo de Caixa — Editar/Excluir Despesa

- Cada despesa lançada agora tem botões **Editar** e **Excluir** na tabela de histórico de saídas.
- Nova tela `editar-despesa.handlebars`.

---

## 4. Vendedores — Listagem, Edição e Exclusão

- Nova tela `vendedores.handlebars` com todos os usuários cadastrados.
- Edição permite trocar o **cargo** e, opcionalmente, redefinir a **senha** (se deixado em branco, mantém a senha atual).
- Exclusão bloqueada para o **próprio usuário logado**, evitando se autoexcluir por engano.
- O menu agora aponta para "Vendedores" (lista), de onde também dá pra cadastrar novos.

---

## 5. Correções de validação (Zod)

- `clienteValidator.js`: campos opcionais (telefone/cpf) agora tratam corretamente string vazia vinda de formulário, e `limite_credito` usa `coerce.number()` (antes exigia número e sempre falhava vindo de um `<form>`).
- `produtoValidator.js`: validação de `cor` (opcional) e `quantidade` (inteiro ≥ 0).
- `usuarioValidator.js`: novo schema de atualização com senha opcional.
- `vendaValidator.js`: exige cliente selecionado quando `meio_pagamento === 'Fiado'`.

---

## ⚠️ Passo obrigatório antes de rodar

Execute o script **`MIGRACAO_NOVAS_FUNCOES.sql`** no seu banco de dados MySQL. Ele cria a tabela `clientes` e adiciona as colunas novas em `produtos` e `vendas`. Sem isso, o sistema vai dar erro de "coluna/tabela não existe".

Depois de rodar a migração:
```bash
pnpm install   # ou npm install
node app.js
```
