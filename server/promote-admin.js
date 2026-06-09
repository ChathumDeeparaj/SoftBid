require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate(
    { email: 'superadmin@softbid.com' },
    { $set: { isSuperAdmin: true, role: 'admin' } },
    { new: true }
  );
  if (user) {
    console.log(`Successfully promoted ${user.email} to Super Admin!`);
  } else {
    console.log('User superadmin@softbid.com not found.');
  }
  process.exit();
}
run();
