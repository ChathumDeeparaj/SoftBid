require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Create Admin
    const adminExists = await User.findOne({ email: 'admin@softbid.com' });
    if (!adminExists) {
      await User.create({
        email: 'admin@softbid.com',
        password: 'password123',
        role: 'admin',
        isSuperAdmin: false,
        isVerified: true
      });
      console.log('✅ Admin created: admin@softbid.com / password123');
    } else {
      console.log('⚠️ Admin (admin@softbid.com) already exists');
    }

    // Create Super Admin
    const superAdminExists = await User.findOne({ email: 'superadmin@softbid.com' });
    if (!superAdminExists) {
      await User.create({
        email: 'whw',
        password: 'password123',
        role: 'admin',
        isSuperAdmin: true,
        isVerified: true
      });
      console.log('✅ Super Admin created: superadmin@softbid.com / password123');
    } else {
      console.log('⚠️ Super Admin (superadmin@softbid.com) already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admins:', error);
    process.exit(1);
  }
};

seedAdmins();
