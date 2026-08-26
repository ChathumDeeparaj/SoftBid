require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Project = require('./models/Project');
const NpeConfig = require('./models/NpeConfig');
const { calculateNPE } = require('./services/npeEngine');

const seedAuctionData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected!');

    console.log('Cleaning up old test data...');
    await User.deleteMany({ email: { $in: ['client@test.com', 'pro1@test.com', 'pro2@test.com', 'pro3@test.com'] } });

    console.log('Creating Client...');
    const client = await User.create({
      email: 'client@test.com',
      password: 'password123',
      role: 'client',
      companyName: 'Test Corp',
    });

    console.log('Creating Project with NPE...');
    let config = await NpeConfig.findOne();
    if (!config) config = await NpeConfig.create({});

    const npeResult = calculateNPE(
      { selectedFeatures: ['user_auth', 'payment_gateway', 'realtime_chat'], integrations: 2, securityLevel: 'high' },
      config
    );

    const project = await Project.create({
      title: 'E-Commerce Platform Redesign',
      description: 'Looking to overhaul our e-commerce site with realtime chat and payment gateway.',
      clientBudgetLKR: 180000,
      npeEstimate: npeResult.benchmark,
      client: client._id,
      selectedFeatures: ['user_auth', 'payment_gateway', 'realtime_chat'],
      integrations: 2,
      securityLevel: 'high'
    });

    console.log(`✅ Project created! ID: ${project._id} | NPE: LKR ${npeResult.benchmark.toLocaleString()}`);

    console.log('Creating 3 Distinct Providers...');
    // Provider 1: Very High Quality & Experience
    const pro1 = await User.create({
      email: 'pro1@test.com',
      password: 'password123',
      role: 'provider',
      companyName: 'Elite Software Devs',
      portfolioUrl: 'https://elitedevs.com',
      yearsExperience: 10,
      completedProjects: 45,
      successRate: 98,
      feedbackScore: 4.9,
      country: 'USA',
      isVerified: true
    });

    // Provider 2: Medium Quality & Experience
    const pro2 = await User.create({
      email: 'pro2@test.com',
      password: 'password123',
      role: 'provider',
      companyName: 'Solid Tech Solutions',
      portfolioUrl: 'https://solidtech.co.uk',
      yearsExperience: 4,
      completedProjects: 15,
      successRate: 85,
      feedbackScore: 4.2,
      country: 'UK',
    });

    // Provider 3: Low Quality & Experience (Newbie)
    const pro3 = await User.create({
      email: 'pro3@test.com',
      password: 'password123',
      role: 'provider',
      companyName: 'Cheap Code Co',
      portfolioUrl: 'https://cheapcode.io',
      yearsExperience: 1,
      completedProjects: 2,
      successRate: 60,
      feedbackScore: 3.0,
      country: 'India',
    });

    console.log('✅ Providers created!');
    console.log('----------------------------------------------------');
    console.log('Test Accounts created successfully. All passwords are "password123"');
    console.log(`Client Login: client@test.com`);
    console.log(`Provider 1 (Elite) Login: pro1@test.com`);
    console.log(`Provider 2 (Mid) Login: pro2@test.com`);
    console.log(`Provider 3 (Newbie) Login: pro3@test.com`);
    console.log(`\nProject ID to test Live Auction: ${project._id}`);
    console.log(`URL: http://localhost:5173/project/${project._id}/live`);
    console.log('----------------------------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding data:', err);
    process.exit(1);
  }
};

seedAuctionData();
