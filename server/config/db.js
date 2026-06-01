const mongoose = require('mongoose');

const RETRY_DELAY_MS = 5000;  // Wait 5 seconds between retries
const MAX_RETRIES = 10;        // Try up to 10 times before giving up

const connectDB = async (retries = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected. Will attempt to reconnect automatically...');
    });

    mongoose.connection.on('reconnected', () => {
      console.info('✅ MongoDB reconnected successfully.');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed: ${error.message}`);

    if (retries < MAX_RETRIES) {
      console.warn(`🔄 Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s... (attempt ${retries + 1}/${MAX_RETRIES})`);
      console.warn('💡 If this keeps failing, go to MongoDB Atlas → Network Access and add your current IP.');
      setTimeout(() => connectDB(retries + 1), RETRY_DELAY_MS);
    } else {
      console.error('🚨 Could not connect to MongoDB after maximum retries. Giving up.');
      console.error('   → Go to https://cloud.mongodb.com → Network Access → Add Current IP Address');
      console.warn('⚠️  Server is running WITHOUT a database connection. Fix your IP whitelist and save any file to trigger nodemon restart.');
      // Removed process.exit(1) so nodemon stays alive — fix the Atlas IP, then save a file to reconnect
    }
  }
};

module.exports = connectDB;
