-- ============================================================
-- MIGRAÇÃO: Novas funcionalidades do Sistema Loja
-- Execute este script no seu banco MySQL (ex: via phpMyAdmin,
-- MySQL Workbench ou linha de comando) ANTES de rodar o sistema
-- com o novo código.
-- ============================================================

-- 1) Tabela de Clientes (cadastro + controle de compras fiado)
CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  telefone VARCHAR(20) NULL,
  cpf VARCHAR(11) NULL,
  limite_credito DECIMAL(10,2) NOT NULL DEFAULT 0,
  saldo_devedor DECIMAL(10,2) NOT NULL DEFAULT 0
);

-- 2) Novos campos no cadastro de Produtos (cor e quantidade em estoque)
ALTER TABLE produtos
  ADD COLUMN cor VARCHAR(40) NULL,
  ADD COLUMN quantidade INT NOT NULL DEFAULT 1;

-- 3) Vínculo entre Vendas e Clientes (usado nas vendas Fiado)
ALTER TABLE vendas
  ADD COLUMN codigo_cliente INT NULL;

-- ============================================================
-- IMPORTANTE:
-- Se você já tem produtos cadastrados, eles vão receber
-- quantidade = 1 automaticamente (produto único em estoque).
-- Se algum produto tiver mais de 1 peça, atualize manualmente:
--
-- UPDATE produtos SET quantidade = 5 WHERE codigo = '12345';
-- ============================================================
