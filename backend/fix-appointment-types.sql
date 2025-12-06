-- Skripta koja dodaje appointmentTypeId terminima koji ga nemaju
-- Koristi prvi tip pregleda (Kontrolni pregled) kao default

-- Prvo prikazi trenutno stanje
SELECT 
    id, 
    date, 
    timeSlot, 
    status,
    appointmentTypeId,
    CASE 
        WHEN appointmentTypeId IS NULL THEN 'NEMA TIP'
        ELSE 'IMA TIP'
    END AS 'status_tipa'
FROM appointments;

-- Proverimo koji tipovi pregleda postoje
SELECT id, name, specialization, price, durationMinutes 
FROM appointment_types 
LIMIT 5;

-- UPDATE komanda (zakomentarisana za sigurnost - otkamentariši kada si sigurna)
-- UPDATE appointments 
-- SET appointmentTypeId = (
--     SELECT id FROM appointment_types WHERE name = 'Kontrolni pregled' LIMIT 1
-- )
-- WHERE appointmentTypeId IS NULL;

-- Provera posle update-a
-- SELECT 
--     COUNT(*) as ukupno_termina,
--     SUM(CASE WHEN appointmentTypeId IS NULL THEN 1 ELSE 0 END) as bez_tipa,
--     SUM(CASE WHEN appointmentTypeId IS NOT NULL THEN 1 ELSE 0 END) as sa_tipom
-- FROM appointments;
