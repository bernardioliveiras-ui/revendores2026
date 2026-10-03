-- MIX10 PRO - atualização estrutural 2026-09-18
-- Aplicar UMA VEZ no banco MySQL já existente, depois de realizar backup.
-- Migração exclusivamente aditiva: não remove tabelas, linhas ou colunas históricas.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

ALTER TABLE `users`
  ADD COLUMN `password_hash` varchar(255) DEFAULT NULL AFTER `email_verified_at`,
  ADD COLUMN `must_change_password` int NOT NULL DEFAULT 0 AFTER `password_hash`,
  ADD COLUMN `failed_login_attempts` int NOT NULL DEFAULT 0 AFTER `must_change_password`,
  ADD COLUMN `locked_until` varchar(40) DEFAULT NULL AFTER `failed_login_attempts`;

ALTER TABLE `orders`
  ADD COLUMN `order_type` varchar(20) NOT NULL DEFAULT 'replenishment' AFTER `status`,
  ADD COLUMN `carrier` varchar(120) DEFAULT NULL AFTER `shipping_state`,
  ADD COLUMN `shipped_at` varchar(40) DEFAULT NULL AFTER `tracking_code`;

CREATE TABLE IF NOT EXISTS `initial_purchases` (
  `id` varchar(80) NOT NULL,
  `email` varchar(254) NOT NULL,
  `name` varchar(120) NOT NULL,
  `phone` varchar(32) NOT NULL,
  `cpf_cnpj` varchar(24) NOT NULL,
  `postal_code` varchar(16) NOT NULL,
  `street` varchar(220) NOT NULL,
  `number` varchar(32) NOT NULL,
  `complement` varchar(160) NOT NULL DEFAULT '',
  `district` varchar(120) NOT NULL,
  `city` varchar(120) NOT NULL,
  `state` varchar(2) NOT NULL,
  `kit` varchar(20) NOT NULL,
  `boxes` int NOT NULL,
  `unit_price_cents` int NOT NULL,
  `total_cents` int NOT NULL,
  `billing_type` varchar(20) NOT NULL DEFAULT 'UNDEFINED',
  `status` varchar(30) NOT NULL DEFAULT 'payment_pending',
  `asaas_customer_id` varchar(120) DEFAULT NULL,
  `asaas_payment_id` varchar(120) DEFAULT NULL,
  `asaas_invoice_url` varchar(1000) DEFAULT NULL,
  `asaas_qr_payload` varchar(2048) DEFAULT NULL,
  `asaas_qr_image` varchar(2048) DEFAULT NULL,
  `payment_due_date` varchar(20) DEFAULT NULL,
  `organization_id` varchar(80) DEFAULT NULL,
  `user_id` varchar(80) DEFAULT NULL,
  `order_id` varchar(80) DEFAULT NULL,
  `utm_source` varchar(120) NOT NULL DEFAULT '',
  `utm_medium` varchar(120) NOT NULL DEFAULT '',
  `utm_campaign` varchar(180) NOT NULL DEFAULT '',
  `utm_content` varchar(180) NOT NULL DEFAULT '',
  `landing_page` varchar(500) NOT NULL DEFAULT '',
  `created_at` varchar(40) NOT NULL,
  `updated_at` varchar(40) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_initial_purchases_asaas_payment` (`asaas_payment_id`),
  KEY `idx_initial_purchases_email_status` (`email`,`status`),
  KEY `idx_initial_purchases_cpf_status` (`cpf_cnpj`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `access_provisioning` (
  `id` varchar(80) NOT NULL,
  `initial_purchase_id` varchar(80) NOT NULL,
  `organization_id` varchar(80) NOT NULL,
  `user_id` varchar(80) NOT NULL,
  `order_id` varchar(80) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ready',
  `secret_ciphertext` varchar(2000) DEFAULT NULL,
  `secret_iv` varchar(200) DEFAULT NULL,
  `secret_expires_at` varchar(40) DEFAULT NULL,
  `delivered_at` varchar(40) DEFAULT NULL,
  `created_at` varchar(40) NOT NULL,
  `updated_at` varchar(40) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_access_provisioning_purchase` (`initial_purchase_id`),
  UNIQUE KEY `idx_access_provisioning_order` (`order_id`),
  KEY `idx_access_provisioning_status` (`status`),
  CONSTRAINT `fk_access_purchase` FOREIGN KEY (`initial_purchase_id`) REFERENCES `initial_purchases` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_access_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`),
  CONSTRAINT `fk_access_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `fk_access_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
