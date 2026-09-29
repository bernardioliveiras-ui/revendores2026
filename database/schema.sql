SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` varchar(80) NOT NULL,
  `email` varchar(254) NOT NULL,
  `name` varchar(120) NOT NULL DEFAULT '',
  `phone` varchar(32) NOT NULL DEFAULT '',
  `role` varchar(20) NOT NULL DEFAULT 'reseller',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `password_hash` varchar(255) DEFAULT NULL,
  `must_change_password` int NOT NULL DEFAULT 1,
  `failed_login_attempts` int NOT NULL DEFAULT 0,
  `locked_until` varchar(40) DEFAULT NULL,
  `created_at` varchar(40) NOT NULL,
  `updated_at` varchar(40) NOT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `idx_users_email` (`email`), KEY `idx_users_role_status` (`role`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `auth_sessions` (
  `token_hash` varchar(128) NOT NULL, `user_id` varchar(80) NOT NULL, `expires_at` varchar(40) NOT NULL, `created_at` varchar(40) NOT NULL, `last_seen_at` varchar(40) NOT NULL,
  PRIMARY KEY (`token_hash`), KEY `idx_auth_sessions_user` (`user_id`), KEY `idx_auth_sessions_expires` (`expires_at`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchases` (
  `id` varchar(80) NOT NULL, `order_number` varchar(60) NOT NULL,
  `name` varchar(120) NOT NULL, `email` varchar(254) NOT NULL, `phone` varchar(32) NOT NULL, `cpf_cnpj` varchar(24) NOT NULL,
  `postal_code` varchar(16) NOT NULL, `street` varchar(220) NOT NULL, `number` varchar(32) NOT NULL, `complement` varchar(160) NOT NULL DEFAULT '', `district` varchar(120) NOT NULL, `city` varchar(120) NOT NULL, `state` varchar(2) NOT NULL,
  `kit` varchar(20) NOT NULL, `boxes` int NOT NULL, `unit_price_cents` int NOT NULL, `total_cents` int NOT NULL,
  `payment_status` varchar(30) NOT NULL DEFAULT 'payment_pending', `shipping_status` varchar(30) NOT NULL DEFAULT 'awaiting_payment',
  `carrier` varchar(120) DEFAULT NULL, `tracking_code` varchar(120) DEFAULT NULL, `shipped_at` varchar(40) DEFAULT NULL, `delivered_at` varchar(40) DEFAULT NULL,
  `asaas_customer_id` varchar(120) DEFAULT NULL, `asaas_payment_id` varchar(120) DEFAULT NULL, `asaas_invoice_url` varchar(1000) DEFAULT NULL,
  `user_id` varchar(80) DEFAULT NULL, `access_released_at` varchar(40) DEFAULT NULL,
  `utm_source` varchar(120) NOT NULL DEFAULT '', `utm_medium` varchar(120) NOT NULL DEFAULT '', `utm_campaign` varchar(180) NOT NULL DEFAULT '', `utm_content` varchar(180) NOT NULL DEFAULT '', `landing_page` varchar(500) NOT NULL DEFAULT '',
  `created_at` varchar(40) NOT NULL, `updated_at` varchar(40) NOT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `idx_purchases_order_number` (`order_number`), UNIQUE KEY `idx_purchases_asaas_payment` (`asaas_payment_id`), KEY `idx_purchases_payment_created` (`payment_status`,`created_at`), KEY `idx_purchases_email` (`email`),
  CONSTRAINT `fk_purchases_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reseller_profiles` (
  `id` varchar(80) NOT NULL, `user_id` varchar(80) NOT NULL, `purchase_id` varchar(80) NOT NULL, `cpf_cnpj` varchar(24) NOT NULL,
  `postal_code` varchar(16) NOT NULL, `street` varchar(220) NOT NULL, `number` varchar(32) NOT NULL, `complement` varchar(160) NOT NULL DEFAULT '', `district` varchar(120) NOT NULL, `city` varchar(120) NOT NULL, `state` varchar(2) NOT NULL,
  `initial_kit` varchar(20) NOT NULL, `initial_boxes` int NOT NULL, `created_at` varchar(40) NOT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `idx_reseller_profiles_user` (`user_id`), UNIQUE KEY `idx_reseller_profiles_purchase` (`purchase_id`),
  CONSTRAINT `fk_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_profiles_purchase` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_movements` (
  `id` varchar(80) NOT NULL, `user_id` varchar(80) NOT NULL, `type` varchar(30) NOT NULL, `boxes` int NOT NULL, `reference_type` varchar(30) NOT NULL DEFAULT 'manual', `reference_id` varchar(80) NOT NULL DEFAULT '', `notes` varchar(1000) NOT NULL DEFAULT '', `occurred_at` varchar(40) NOT NULL, `created_at` varchar(40) NOT NULL,
  PRIMARY KEY (`id`), KEY `idx_stock_user_date` (`user_id`,`occurred_at`), CONSTRAINT `fk_stock_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sales` (
  `id` varchar(80) NOT NULL, `user_id` varchar(80) NOT NULL, `boxes` int NOT NULL, `unit_value_cents` int NOT NULL, `total_value_cents` int NOT NULL, `channel` varchar(40) NOT NULL DEFAULT 'other', `customer_name` varchar(120) NOT NULL DEFAULT '', `notes` varchar(1000) NOT NULL DEFAULT '', `sold_at` varchar(40) NOT NULL, `created_at` varchar(40) NOT NULL,
  PRIMARY KEY (`id`), KEY `idx_sales_user_date` (`user_id`,`sold_at`), CONSTRAINT `fk_sales_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `affiliate_referrals` (
  `id` varchar(80) NOT NULL, `user_id` varchar(80) NOT NULL, `public_code` varchar(64) NOT NULL, `customer_name` varchar(120) NOT NULL DEFAULT '', `whatsapp` varchar(24) NOT NULL, `status` varchar(30) NOT NULL DEFAULT 'created', `click_count` int NOT NULL DEFAULT 0, `created_at` varchar(40) NOT NULL, `updated_at` varchar(40) NOT NULL,
  PRIMARY KEY (`id`), UNIQUE KEY `idx_referrals_code` (`public_code`), KEY `idx_referrals_user_created` (`user_id`,`created_at`), CONSTRAINT `fk_referrals_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `affiliate_clicks` (
  `id` int NOT NULL AUTO_INCREMENT, `referral_id` varchar(80) NOT NULL, `referrer` varchar(500) NOT NULL DEFAULT '', `user_agent` varchar(500) NOT NULL DEFAULT '', `clicked_at` varchar(40) NOT NULL,
  PRIMARY KEY (`id`), KEY `idx_affiliate_click_referral` (`referral_id`,`clicked_at`), CONSTRAINT `fk_affiliate_click_referral` FOREIGN KEY (`referral_id`) REFERENCES `affiliate_referrals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `asaas_events` (
  `event_id` varchar(180) NOT NULL, `event_type` varchar(100) NOT NULL, `payment_id` varchar(120) DEFAULT NULL, `received_at` varchar(40) NOT NULL,
  PRIMARY KEY (`event_id`), KEY `idx_asaas_event_payment` (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
