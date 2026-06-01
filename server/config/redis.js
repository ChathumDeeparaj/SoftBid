const { createClient } = require('redis');

let redisClient;

const connectRedis = async () => {
  if (!process.env.REDIS_URI) {
    console.warn('REDIS_URI is not defined in .env. Skipping Redis connection for now.');
    return null;
  }

  redisClient = createClient({
    url: process.env.REDIS_URI
  });

  redisClient.on('error', (err) => console.error('Redis Client Error:', err));
  
  redisClient.on('connect', () => {
    console.log('Redis Connected successfully.');
  });
  
  redisClient.on('reconnecting', () => {
    console.log('Redis attempting to reconnect...');
  });

  try {
    await redisClient.connect();
  } catch (error) {
    console.error(`Error connecting to Redis: ${error.message}`);
  }

  return redisClient;
};

module.exports = {
  connectRedis,
  getRedisClient: () => redisClient
};
