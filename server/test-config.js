require('dotenv').config();
const mongoose = require('mongoose');
const NpeConfig = require('./models/NpeConfig');
async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const config = await NpeConfig.findOne();
  console.log(JSON.stringify(config.features, null, 2));
  process.exit();
}
run();
