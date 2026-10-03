-- Execute UMA VEZ no banco existente, antes de publicar esta versão.
-- Backup recomendado; aditivo, sem alterar pedidos, preços ou credenciais.
ALTER TABLE purchases
  ADD COLUMN welcome_status varchar(30) NOT NULL DEFAULT 'pending',
  ADD COLUMN welcome_secret varchar(1000) NULL,
  ADD COLUMN welcome_iv varchar(40) NULL,
  ADD COLUMN welcome_sent_at varchar(40) NULL;
