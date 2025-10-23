// const redis = require('redis');
//
// // Initialize and configure the Redis client
// const redisClient = redis.createClient({
//     url: 'redis://localhost:6379' // Replace with your Redis URL
// });
//
// redisClient.on('error', (err) => console.error('Redis Client Error:', err));
//
// // Connect to Redis
// redisClient.connect();
//
// /**
//  * Stores session data in Redis with an expiration time (default: 30 days).
//  * @param {string} key - The Redis key (e.g., `booking:userId`).
//  * @param {object} data - The session data to store.
//  * @param {number} ttlSeconds - Optional TTL in seconds (default: 30 days).
//  */
// async function storeSession(key, data, ttlSeconds = 30 * 24 * 60 * 60) {
//     try {
//         await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
//         console.log(`Stored session for key: ${key}`);
//     } catch (error) {
//         console.error('Failed to store session:', error);
//         throw error;
//     }
// }
//
// /**
//  * Retrieves session data from Redis.
//  * @param {string} key - The Redis key (e.g., `booking:userId`).
//  * @returns {object|null} - Parsed session data or null if not found.
//  */
// async function getSession(key) {
//     try {
//         const data = await redisClient.get(key);
//         return data ? JSON.parse(data) : null;
//     } catch (error) {
//         console.error('Failed to fetch session:', error);
//         throw error;
//     }
// }
//
// module.exports = { storeSession, getSession };