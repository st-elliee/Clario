-- ============================================================
--  Clario - "Clarity in every client."
--  Ερώτημα 1: Αναζήτηση πελάτη με βάση το επώνυμο
-- ============================================================
--  Σενάριο: Ο υπάλληλος ζητά από το chatbot "Βρες τον Αλεξίου"
-- ============================================================

USE `clario`;

SELECT client_id, last_name, first_name,
       company_name, phone, email, client_type
FROM client
WHERE last_name LIKE '%Αλεξίου%'
  AND is_active = TRUE;