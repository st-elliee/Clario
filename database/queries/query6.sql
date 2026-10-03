-- ============================================================
--  Clario - "Clarity in every client."
--  Ερώτημα 6: Συνολικά έσοδα ανά μήνα για το τρέχον έτος
-- ============================================================
--  Σενάριο: Ο admin θέλει να δει την οικονομική εικόνα
--           του γραφείου για το τρέχον έτος
-- ============================================================

USE `clario`;

SELECT MONTH(created_at)               AS month,
       COUNT(*)                         AS total_services,
       SUM(amount_billed)               AS total_billed,
       SUM(amount_paid)                 AS total_paid,
       SUM(amount_billed - amount_paid) AS total_remaining
FROM client_service
WHERE YEAR(created_at) = YEAR(CURDATE())
GROUP BY MONTH(created_at)
ORDER BY month ASC;