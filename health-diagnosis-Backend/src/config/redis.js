const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL;

// Chỉ connect Redis khi REDIS_URL được set và không phải localhost mặc định
if (redisUrl && redisUrl !== 'redis://localhost:6379') {
  const client = createClient({ url: redisUrl });

  client.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  client.on('connect', () => {
    console.log('[Redis] Connected');
  });

  client.connect().catch(() => {});

  module.exports = client;
} else {
  // Redis không available — export dummy client
  module.exports = {
    sendCommand: async () => { throw new Error('Redis not configured'); },
    quit: async () => {},
  };
}
