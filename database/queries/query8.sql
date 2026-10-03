-- ============================================================
--  Clario - "Clarity in every client."
--  Ερώτημα 8: Εμφάνιση ιστορικού ενεργειών για
--             συγκεκριμένο πελάτη
-- ============================================================
--  Σενάριο: Ο admin θέλει να δει ποιοι υπάλληλοι και
--           πότε άνοιξαν την καρτέλα του πελάτη 1
-- ============================================================

USE `clario`;

SELECT e.full_name AS employee_name,
       a.action_type, a.timestamp,
       a.ip_address, a.details
FROM action a
JOIN employee e ON a.employee_id = e.employee_id
WHERE a.client_id = 1
ORDER BY a.timestamp DESC;