-- Execute UMA VEZ no banco atual antes de publicar esta versão.
-- Preserva compras/revendedores existentes e adiciona os dados fiscais exigidos para CNPJ.

ALTER TABLE `purchases`
  ADD COLUMN `company_trade_name` varchar(160) NOT NULL DEFAULT '' AFTER `cpf_cnpj`,
  ADD COLUMN `state_registration` varchar(40) NOT NULL DEFAULT '' AFTER `company_trade_name`,
  ADD COLUMN `municipal_registration` varchar(40) NOT NULL DEFAULT '' AFTER `state_registration`;

ALTER TABLE `reseller_profiles`
  ADD COLUMN `company_trade_name` varchar(160) NOT NULL DEFAULT '' AFTER `cpf_cnpj`,
  ADD COLUMN `state_registration` varchar(40) NOT NULL DEFAULT '' AFTER `company_trade_name`,
  ADD COLUMN `municipal_registration` varchar(40) NOT NULL DEFAULT '' AFTER `state_registration`;
