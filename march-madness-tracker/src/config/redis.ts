import { Redis } from 'ioredis';
import logger from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let sharedRedis: Redis | null = null;
let redisHealthy = false;

function registerRedisEvents(client: Redis): void {
  client.on('connect', () => {
    redisHealthy = true;
    logger.info('Redis connection established');
  });

  client.on('ready', () => {
    redisHealthy = true;
  });

  client.on('close', () => {
    redisHealthy = false;
  });

  client.on('error', (error) => {
    redisHealthy = false;
    logger.warn(`Redis unavailable, falling back to direct database reads: ${error.message}`);
  });
}

async function ensureConnected(client: Redis): Promise<void> {
  if (client.status === 'ready' || client.status === 'connect' || client.status === 'connecting') {
    return;
  }

  try {
    await client.connect();
  } catch {
    redisHealthy = false;
  }
}

export function getRedisClient(): Redis {
  if (!sharedRedis) {
    sharedRedis = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });

    registerRedisEvents(sharedRedis);
  }

  return sharedRedis;
}

export async function safeRedisGet(key: string): Promise<string | null> {
  const client = getRedisClient();

  try {
    await ensureConnected(client);
    return await client.get(key);
  } catch (error) {
    logger.warn(
      `Redis read failed for key "${key}", continuing without cache: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
    return null;
  }
}

export async function safeRedisSetEx(key: string, ttl: number, value: string): Promise<void> {
  const client = getRedisClient();

  try {
    await ensureConnected(client);
    await client.setex(key, ttl, value);
  } catch (error) {
    logger.warn(
      `Redis write failed for key "${key}", continuing without cache: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

export function getRedisHealth(): { configured: boolean; connected: boolean; status: 'up' | 'down' } {
  return {
    configured: Boolean(redisUrl),
    connected: redisHealthy,
    status: redisHealthy ? 'up' : 'down',
  };
}
