-- ============================================================
--  Clario - "Clarity in every client."
--  Ερώτημα 3: Ενημέρωση κατάστασης υπηρεσίας
-- ============================================================
--  Σενάριο: Ο υπάλληλος ολοκληρώνει τη Φορολογική Δήλωση
--           Ε1 του πελάτη 2 για το 2025
-- ============================================================

USE `clario`;

UPDATE client_service
SET status         = 'completed',
    completed_date = CURDATE(),
    updated_by     = 2,
    updated_at     = NOW()
WHERE client_id  = 2
  AND service_id = 1
  AND year       = 2025
  AND period     = 'Ετήσιο';