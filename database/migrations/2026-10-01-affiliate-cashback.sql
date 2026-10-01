-- MIX10 PRO: vínculo da compra com indicação e carteira de cashback.
-- Executar após backup do banco. Valor fixo: R$ 15,00 = 1500 centavos.

ALTER TABLE purchases
  ADD COLUMN referral_id varchar(80) NULL,
  ADD KEY idx_purchases_referral (referral_id);

CREATE TABLE affiliate_cashbacks (
  id varchar(80) NOT NULL,
  referral_id varchar(80) NOT NULL,
  reseller_user_id varchar(80) NOT NULL,
  purchase_id varchar(80) NOT NULL,
  amount_cents int NOT NULL DEFAULT 1500,
  status varchar(20) NOT NULL DEFAULT 'pending',
  qualifying_boxes int NOT NULL DEFAULT 1,
  approved_at varchar(40) NULL,
  approved_by varchar(80) NULL,
  paid_at varchar(40) NULL,
  notes varchar(500) NOT NULL DEFAULT '',
  created_at varchar(40) NOT NULL,
  updated_at varchar(40) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY idx_cashback_purchase (purchase_id),
  KEY idx_cashback_reseller_status (reseller_user_id, status),
  KEY idx_cashback_referral (referral_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
