-- ============================================================
--  Clario - "Clarity in every client."
--  Ερώτημα 4: Εισαγωγή νέου πελάτη
-- ============================================================
--  Σενάριο: Ο υπάλληλος με employee_id = 2 προσθέτει
--           νέο πελάτη στο σύστημα
-- ============================================================

USE `clario`;

INSERT INTO client
    (afm, last_name, first_name, client_type,
     phone, email, doy, is_active, created_by)
VALUES
    ('[encrypted_afm]', 'Παπαδάκης', 'Κωνσταντίνος',
     'individual', '6973000004',
     'k.papadakis@email.gr', 'ΔΟΥ Θεσσαλονίκης',
     TRUE, 2);