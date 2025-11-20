import { DataSource } from 'typeorm';
import { Allergy } from '../../../database/entities/allergy.entity';

export async function seedAllergies(dataSource: DataSource): Promise<void> {
  const allergyRepository = dataSource.getRepository(Allergy);

  // Proveri da li već postoje alergije
  const count = await allergyRepository.count();
  if (count > 0) {
    console.log('✅ Alergije već postoje, preskačem seed...');
    return;
  }

  const allergies = [
    // Lekovi
    'Penicilin',
    'Amoksicilin',
    'Aspirin',
    'Ibuprofen',
    'Kodein',
    'Morfijum',
    'Sulfonamidi',
    'Tetraciklin',
    'Cefalosporini',
    'Streptomicin',
    'Beta-laktamski antibiotici',
    'Diklofenak',
    'Naproksen',
    'Tramadol',
    'Paracetamol',
    
    // Hrana
    'Kikiriki',
    'Lešnik',
    'Badem',
    'Orah',
    'Mleko',
    'Jaja',
    'Riba',
    'Školjke',
    'Soja',
    'Pšenica',
    'Gluten',
    'Kukuruz',
    'Susam',
    'Lupin',
    'Mekotinje (hobotnica, lignje)',
    'Rakovi',
    
    // Ambijentalne
    'Polen trave',
    'Polen ambrozije',
    'Polen breze',
    'Grinje prašine',
    'Dlaka mačke',
    'Dlaka psa',
    'Buđ',
    'Spore plesni',
    
    // Insekti
    'Ubod pčele',
    'Ubod ose',
    'Ubod stršljena',
    
    // Lateks i druge
    'Lateks',
    'Nikal',
    'Parfemi',
    'Deterđenti',
  ];

  const allergyEntities = allergies.map((name) => 
    allergyRepository.create({ name })
  );

  await allergyRepository.save(allergyEntities);
  console.log(`✅ Seeded ${allergyEntities.length} alergija`);
}
