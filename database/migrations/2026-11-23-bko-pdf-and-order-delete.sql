-- Executável no MySQL já existente. Não apaga nem altera compras anteriores.
CREATE TABLE IF NOT EXISTS `bko_manual_pdfs` (
  `id` tinyint NOT NULL PRIMARY KEY,
  `title` varchar(180) NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `size_bytes` int NOT NULL,
  `file_bytes` longblob NOT NULL,
  `updated_by` varchar(80) NOT NULL,
  `updated_at` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `bko_order_deletions` (
  `id` char(36) NOT NULL PRIMARY KEY,
  `purchase_id` varchar(80) NOT NULL,
  `order_number` varchar(60) NOT NULL,
  `asaas_payment_id` varchar(120) NULL,
  `payment_status` varchar(30) NOT NULL,
  `deleted_by` varchar(80) NOT NULL,
  `deleted_at` varchar(40) NOT NULL,
  UNIQUE KEY `idx_deleted_purchase` (`purchase_id`),
  KEY `idx_deleted_order` (`order_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
