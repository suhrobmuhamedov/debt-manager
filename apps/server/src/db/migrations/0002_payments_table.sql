-- Create payments table if not exists
CREATE TABLE IF NOT EXISTS payments (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  debt_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  payment_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  KEY idx_payments_debt_id (debt_id),
  CONSTRAINT fk_payments_debt FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE
);

-- Add paidAmount and status columns to debts if not already exist
ALTER TABLE debts 
ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(15, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status ENUM('pending', 'partial', 'paid') DEFAULT 'pending';
