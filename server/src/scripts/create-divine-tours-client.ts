import { connectDatabase, disconnectDatabase } from '../config/database';
import { createClient } from '../services/client.service';

async function main() {
  try {
    await connectDatabase();

    const password = process.env.DIVINE_TOURS_PASSWORD;

    if (!password) {
      throw new Error('DIVINE_TOURS_PASSWORD environment variable is not set');
    }

    const result = await createClient({
      username: 'divine_tours',
      password,
      businessName: 'Divine Tours',
      slug: 'divine-tours',
      categoryId: '6aa7f0c9203f0834afc6a0c2',
      planId: 'internal',
      timezone: 'Asia/Kolkata',
      defaultCountryCode: '91',
    });

    console.log('=== DIVINE TOURS CREATED ===');
    console.log('Client ID:', result.client._id.toString());
    console.log('User ID:', result.user.id);
    console.log('Username:', result.user.username);
    console.log('Category:', result.category.name);
    console.log('Template Pack:', result.templatePack.name);
    console.log('Templates Provisioned:', result.templatesProvisioned);
  } catch (error) {
    console.error('Divine Tours provisioning failed:', error);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

main();
