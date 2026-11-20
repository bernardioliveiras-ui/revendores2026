-- Apply through npm run db:migrate for existing databases (idempotent information_schema checks).
ALTER TABLE `asaas_events` ADD COLUMN `purchase_id` varchar(80) NULL;

CREATE TABLE IF NOT EXISTS `purchase_measurement` (
  `purchase_id` varchar(80) NOT NULL,
  `snapshot` text NOT NULL,
  `withdrawal_token_hash` varchar(64) DEFAULT NULL,
  `confirmed_at` varchar(40) DEFAULT NULL,
  `expires_at` varchar(40) NOT NULL,
  `created_at` varchar(40) NOT NULL,
  PRIMARY KEY (`purchase_id`), KEY `idx_measurement_expiry` (`expires_at`),
  CONSTRAINT `fk_measurement_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `measurement_outbox` (
  `id` varchar(120) NOT NULL,
  `purchase_id` varchar(80) NOT NULL,
  `provider` varchar(8) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `attempts` int NOT NULL DEFAULT 0,
  `next_attempt_at` varchar(40) NOT NULL,
  `sent_at` varchar(40) DEFAULT NULL,
  `last_error` varchar(80) DEFAULT NULL,
  `created_at` varchar(40) NOT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `idx_measurement_purchase_provider` (`purchase_id`, `provider`), KEY `idx_measurement_due` (`status`, `next_attempt_at`),
  CONSTRAINT `fk_outbox_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
