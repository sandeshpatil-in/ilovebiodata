CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  picture TEXT NULL,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  premium_expires_at DATETIME(3) NULL,
  premium_unlocked_at DATETIME(3) NULL,
  premium_source VARCHAR(50) NULL,
  razorpay_payment_id VARCHAR(255) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
    ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
