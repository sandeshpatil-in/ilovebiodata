CREATE TABLE IF NOT EXISTS payments (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  razorpay_order_id VARCHAR(255) NOT NULL,
  amount INT UNSIGNED NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  status ENUM('created', 'paid', 'failed') NOT NULL DEFAULT 'created',
  razorpay_payment_id VARCHAR(255) NULL,
  razorpay_signature VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  paid_at DATETIME(3) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY payments_order_unique (razorpay_order_id),
  KEY payments_user_idx (user_id),
  CONSTRAINT payments_user_fk
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
