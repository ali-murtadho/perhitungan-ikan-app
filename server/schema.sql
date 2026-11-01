-- Skema database Kalkulator Ikan (PostgreSQL 13+ / Supabase)

CREATE TABLE IF NOT EXISTS suppliers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(100) NOT NULL,
  phone_number  VARCHAR(20),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id         UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  transaction_date    TIMESTAMPTZ NOT NULL DEFAULT now(),
  bucket_weight       DECIMAL(5,2)  NOT NULL CHECK (bucket_weight >= 0),
  price_per_kg        DECIMAL(12,2) NOT NULL CHECK (price_per_kg > 0),
  total_weigh_count   INT           NOT NULL CHECK (total_weigh_count > 0),
  total_gross_weight  DECIMAL(10,2) NOT NULL,
  total_net_weight    DECIMAL(10,2) NOT NULL,
  total_amount        DECIMAL(15,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS weighing_details (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id   UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  sequence_number  INT          NOT NULL,
  gross_weight     DECIMAL(5,2) NOT NULL CHECK (gross_weight > 0),
  UNIQUE (transaction_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_transactions_date     ON transactions (transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_supplier ON transactions (supplier_id);
