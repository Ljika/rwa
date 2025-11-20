import { DataSource } from 'typeorm';
import { AppointmentType } from '../../../database/entities/appointment-type.entity';
import { Specialization } from '../../../common/enums/specialization.enum';

export async function seedAppointmentTypes(dataSource: DataSource) {
  const repository = dataSource.getRepository(AppointmentType);

  // Proveri da li već postoje tipovi pregleda
  const count = await repository.count();
  if (count > 0) {
    console.log('⚠️  Tipovi pregleda već postoje. Ažuriram trajanja na 30/60 minuta...');
    // Prvo setuj appointments.appointmentTypeId na NULL
    await dataSource.query('UPDATE appointments SET appointmentTypeId = NULL WHERE appointmentTypeId IS NOT NULL');
    // Sada možemo da obrišemo sve tipove pregleda
    await dataSource.query('DELETE FROM appointment_types');
    console.log('✅ Stari tipovi pregleda obrisani.');
  }

  const appointmentTypes = [
    // Opšta medicina
    { name: 'Kontrolni pregled', specialization: Specialization.GENERAL, price: 2500, durationMinutes: 30, description: 'Opšti zdravstveni pregled' },
    { name: 'Sistematski pregled', specialization: Specialization.GENERAL, price: 4000, durationMinutes: 60, description: 'Detaljan sistematski pregled' },
    
    // Kardiologija
    { name: 'Kardiološki pregled', specialization: Specialization.CARDIOLOGY, price: 3500, durationMinutes: 30, description: 'Pregled kardiovaskularnog sistema' },
    { name: 'EKG', specialization: Specialization.CARDIOLOGY, price: 2000, durationMinutes: 30, description: 'Elektrokardiogram' },
    { name: 'Ultrazvuk srca', specialization: Specialization.CARDIOLOGY, price: 5000, durationMinutes: 60, description: 'Ehokardiografija' },
    { name: 'Holter monitoring 24h', specialization: Specialization.CARDIOLOGY, price: 4500, durationMinutes: 30, description: '24-časovno praćenje rada srca - postavljanje aparata' },
    
    // Urologija
    { name: 'Urološki pregled', specialization: Specialization.UROLOGY, price: 3500, durationMinutes: 30, description: 'Pregled urogenitalnog sistema' },
    { name: 'Ultrazvuk prostata', specialization: Specialization.UROLOGY, price: 4000, durationMinutes: 30, description: 'Ultrazvučni pregled prostate' },
    { name: 'Urinokultura', specialization: Specialization.UROLOGY, price: 1500, durationMinutes: 30, description: 'Mikrobiološka analiza urina - uzimanje uzorka i pregled' },
    
    // Neurologija
    { name: 'Neurološki pregled', specialization: Specialization.NEUROLOGY, price: 4000, durationMinutes: 30, description: 'Pregled nervnog sistema' },
    { name: 'EEG', specialization: Specialization.NEUROLOGY, price: 5000, durationMinutes: 60, description: 'Elektroencefalografija' },
    
    // Dermatologija
    { name: 'Dermatološki pregled', specialization: Specialization.DERMATOLOGY, price: 3000, durationMinutes: 30, description: 'Pregled kože i sluznica' },
    { name: 'Dermatoskopija', specialization: Specialization.DERMATOLOGY, price: 3500, durationMinutes: 30, description: 'Pregled mladeža i promena na koži' },
    
    // Oftalmologija
    { name: 'Oftalmološki pregled', specialization: Specialization.OPHTHALMOLOGY, price: 3000, durationMinutes: 30, description: 'Pregled očiju' },
    { name: 'Određivanje dioptrije', specialization: Specialization.OPHTHALMOLOGY, price: 2500, durationMinutes: 30, description: 'Merenje vida i propisivanje naočara' },
    { name: 'Merenje očnog pritiska', specialization: Specialization.OPHTHALMOLOGY, price: 2000, durationMinutes: 30, description: 'Tonometrija' },
    
    // Pedijatrija
    { name: 'Pedijatrijski pregled', specialization: Specialization.PEDIATRICS, price: 2500, durationMinutes: 30, description: 'Pregled dece' },
    { name: 'Vakcinacija', specialization: Specialization.PEDIATRICS, price: 1500, durationMinutes: 30, description: 'Aplikacija vakcine sa savetovanjem' },
    
    // Ginekologija
    { name: 'Ginekološki pregled', specialization: Specialization.GYNECOLOGY, price: 3500, durationMinutes: 30, description: 'Ginekološki pregled' },
    { name: 'Ultrazvuk ginekološki', specialization: Specialization.GYNECOLOGY, price: 4000, durationMinutes: 30, description: 'Ultrazvučni pregled ženskih organa' },
    { name: 'Papa test', specialization: Specialization.GYNECOLOGY, price: 3000, durationMinutes: 30, description: 'Citološki pregled' },
    
    // Ortopedija
    { name: 'Ortopedski pregled', specialization: Specialization.ORTHOPEDICS, price: 3500, durationMinutes: 30, description: 'Pregled lokomotornog sistema' },
    { name: 'Ultrazvuk mišića i tetiva', specialization: Specialization.ORTHOPEDICS, price: 4000, durationMinutes: 30, description: 'Ultrazvučni pregled mekih tkiva' },
    
    // Psihijatrija
    { name: 'Psihijatrijski pregled', specialization: Specialization.PSYCHIATRY, price: 4500, durationMinutes: 60, description: 'Psihijatrijska evaluacija' },
    { name: 'Psihoterapija - individualna', specialization: Specialization.PSYCHIATRY, price: 5000, durationMinutes: 60, description: 'Individualna psihoterapijska sesija' },
    
    // Endokrinologija
    { name: 'Endokrinološki pregled', specialization: Specialization.ENDOCRINOLOGY, price: 3500, durationMinutes: 30, description: 'Pregled endokrinog sistema' },
    { name: 'Ultrazvuk štitaste žlezde', specialization: Specialization.ENDOCRINOLOGY, price: 3500, durationMinutes: 30, description: 'Ultrazvučni pregled štitaste žlezde' },
    
    // Gastroenterologija
    { name: 'Gastroenterološki pregled', specialization: Specialization.GASTROENTEROLOGY, price: 3500, durationMinutes: 30, description: 'Pregled digestivnog sistema' },
    { name: 'Ultrazvuk abdomena', specialization: Specialization.GASTROENTEROLOGY, price: 4000, durationMinutes: 30, description: 'Ultrazvučni pregled trbuha' },
  ];

  await repository.save(appointmentTypes);
  console.log(`✅ Uspešno dodato ${appointmentTypes.length} tipova pregleda!`);
}
