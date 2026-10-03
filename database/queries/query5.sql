-- ============================================================
--  Clario - "Clarity in every client."
--  Ερώτημα 5: Πελάτες που δεν έχουν κάνει φορολογική
--             δήλωση φέτος
-- ============================================================
--  Σενάριο: Ο admin θέλει να δει ποιοι ενεργοί πελάτες
--           δεν έχουν ακόμα Ε1 για το τρέχον έτος
-- ============================================================

USE `clario`;

SELECT c.client_id, c.last_name, c.first_name, c.phone
FROM client c
WHERE c.is_active = TRUE
  AND NOT EXISTS (
      SELECT 1
      FROM client_service cs
      JOIN service s ON cs.service_id = s.service_id
      WHERE cs.client_id = c.client_id
        AND s.name = 'Φορολογική Δήλωση Ε1'
        AND cs.year = YEAR(CURDATE())
  )
ORDER BY c.last_name ASC;