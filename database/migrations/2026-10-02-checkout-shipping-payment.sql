-- Checkout: frete por CEP + forma de pagamento + parcelamento/taxa.
-- O migrador principal também adiciona estas colunas de forma idempotente.
ALTER TABLE `purchases`
  ADD COLUMN `product_total_cents` int NOT NULL DEFAULT 0,
  ADD COLUMN `shipping_type` varchar(20) NOT NULL DEFAULT '',
  ADD COLUMN `shipping_cents` int NOT NULL DEFAULT 0,
  ADD COLUMN `payment_method` varchar(20) NOT NULL DEFAULT '',
  ADD COLUMN `installments` int NOT NULL DEFAULT 1,
  ADD COLUMN `installment_value_cents` int NOT NULL DEFAULT 0,
  ADD COLUMN `interest_cents` int NOT NULL DEFAULT 0;
