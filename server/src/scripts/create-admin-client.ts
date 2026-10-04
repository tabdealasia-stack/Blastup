import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { env } from '../config/env';
import { logger } from '../config/logger';

async function createAdminClient() {
  try {
    await connectDatabase();

    const user = await User.findOne({ username: env.ADMIN_USERNAME });

    if (!user) {
      throw new Error(
        `Admin user "${env.ADMIN_USERNAME}" not found. Run the existing seed first.`
      );
    }

    const existingClient = await Client.findOne({ userId: user._id });

    if (existingClient) {
      logger.info(
        `Client "${existingClient.businessName}" already exists. Nothing to do.`
      );
      return;
    }

    const businessName = 'Tabdeal';

    const client = await Client.create({
      userId: user._id,
      businessName,
      slug: 'tabdeal',
      status: 'active',
      planId: 'internal',
      settings: {
        timezone: 'Asia/Kolkata',
        defaultCountryCode: '91',
      },
    });

    logger.info(`Client created successfully: ${client.businessName}`);
    logger.info(`Client ID: ${client._id}`);
  } catch (error) {
    logger.error('Admin client creation failed', { error });
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

createAdminClient();