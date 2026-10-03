-- ============================================================
--  Clario - "Clarity in every client."
--  Ερώτημα 2: Εμφάνιση όλων των υπηρεσιών ενός πελάτη
-- ============================================================
--  Σενάριο: Ο υπάλληλος ανοίγει την καρτέλα του πελάτη
--           με client_id = 1
-- ============================================================

USE `clario`;

SELECT s.name AS service_name, s.category,
       cs.year, cs.period, cs.status,
       cs.amount_billed, cs.amount_paid,
       cs.amount_remaining,
       cs.due_date, cs.completed_date, cs.notes
FROM client_service cs
JOIN service s ON cs.service_id = s.service_id
WHERE cs.client_id = 1
ORDER BY cs.year DESC, cs.period ASC;