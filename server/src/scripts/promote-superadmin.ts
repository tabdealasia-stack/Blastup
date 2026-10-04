import mongoose from 'mongoose';
import { env } from '../config/env';
import { User } from '../models/User';

async function run() {
  const username = process.argv[2];

  if (!username) {
    console.error('❌ Error: Username is required.');
    console.error('Usage: npm run promote-superadmin -- <username>');
    process.exit(1);
  }

  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('📦 Connected to database.');

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      console.error(`❌ Error: User '${username}' not found.`);
      process.exit(1);
    }

    if (user.role === 'superadmin') {
      console.log(`✅ User '${user.username}' is already a superadmin.`);
      process.exit(0);
    }

    console.log(`Found user: ${user.username} (Current role: ${user.role})`);
    
    // Promote user
    user.role = 'superadmin';
    await user.save();

    console.log(`🎉 Successfully promoted '${user.username}' to superadmin!`);
    process.exit(0);

  } catch (err) {
    console.error('❌ Error executing promotion:', err);
    process.exit(1);
  }
}

run();
