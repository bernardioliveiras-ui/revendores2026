-- Execute UMA VEZ no banco atual antes de publicar esta versão.
-- Preserva compras existentes e adiciona o detalhamento financeiro do checkout.
ALTER TABLE `purchases`
  ADD COLUMN `product_total_cents` int NOT NULL DEFAULT 0 AFTER `unit_price_cents`,
  ADD COLUMN `shipping_cents` int NOT NULL DEFAULT 0 AFTER `product_total_cents`,
  ADD COLUMN `shipping_service` varchar(80) NOT NULL DEFAULT '' AFTER `shipping_cents`,
  ADD COLUMN `shipping_delivery_time` varchar(80) NOT NULL DEFAULT '' AFTER `shipping_service`,
  ADD COLUMN `payment_method` varchar(20) NOT NULL DEFAULT 'pix' AFTER `shipping_delivery_time`,
  ADD COLUMN `installments` int NOT NULL DEFAULT 1 AFTER `payment_method`,
  ADD COLUMN `installment_value_cents` int NOT NULL DEFAULT 0 AFTER `installments`,
  ADD COLUMN `interest_cents` int NOT NULL DEFAULT 0 AFTER `installment_value_cents`,
  ADD COLUMN `asaas_installment_id` varchar(120) DEFAULT NULL AFTER `asaas_payment_id`;

UPDATE `purchases`
SET `product_total_cents` = `total_cents`,
    `installment_value_cents` = `total_cents`
WHERE `product_total_cents` = 0;
