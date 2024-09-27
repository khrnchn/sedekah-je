import { institutions as institutionsData } from '@/app/data/institutions';
import { institutions, institutionTypeEnum, paymentMethodEnum } from '@/drizzle/schema';
import { db } from './drizzle';

async function seedInstitutions() {
  try {
    for (const institution of institutionsData) {
      await db.insert(institutions).values({
        id: institution.id.toString(), 
        name: institution.name as string,
        type: institution.category as typeof institutionTypeEnum.enumValues[number],
        city: institution.city as string,
        state: institution.state as string,
        facebookLink: '', 
        qrContent: institution.qrContent as string,
        supportedPayments: institution.supportedPayment as typeof paymentMethodEnum.enumValues[number][],
        status: 'pending',
        uploadedBy: 'admin', 
        approvedBy: 'admin',
      }).onConflictDoNothing(); // This will ignore duplicates if you run the script multiple times
    }
    console.log('Institutions seeded successfully');
  } catch (error) {
    console.error('Error seeding institutions:', error);
  } 
}

seedInstitutions();