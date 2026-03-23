ALTER TABLE debts
  ADD COLUMN confirmation_status ENUM('not_required', 'pending', 'confirmed', 'denied') NOT NULL DEFAULT 'not_required',
  ADD COLUMN confirmation_token VARCHAR(64) NULL,
  ADD COLUMN confirmation_expires_at TIMESTAMP NULL,
  ADD COLUMN linked_debt_id INT NULL,
  ADD COLUMN confirmed_by_telegram_id VARCHAR(20) NULL;

CREATE UNIQUE INDEX uq_debts_confirmation_token ON debts (confirmation_token);
CREATE INDEX idx_debts_confirmation_status ON debts (confirmation_status);
CREATE INDEX idx_debts_linked_debt ON debts (linked_debt_id);

ALTER TABLE debts
  ADD CONSTRAINT fk_debts_linked_debt
  FOREIGN KEY (linked_debt_id) REFERENCES debts(id)
  ON DELETE SET NULL;
