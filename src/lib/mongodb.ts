import mongoose from 'mongoose';
import { mongoCircuit } from '@/lib/circuitBreaker';
import { traceDbQuery } from '@/lib/telemetry/spans';

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = global as typeof globalThis & { mongoose?: MongooseCache };

if (!globalWithMongoose.mongoose) {
  globalWithMongoose.mongoose = { conn: null, promise: null };
}

const cached = globalWithMongoose.mongoose;

const poolMax = process.env.NODE_ENV === 'production' ? 20 : 5;

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (mongoCircuit.isOpen()) {
    const err = new Error('Database temporarily unavailable');
    (err as Error & { statusCode?: number }).statusCode = 503;
    throw err;
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: poolMax,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    };

    cached.promise = traceDbQuery('mongodb', 'connect', () =>
      mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
        console.log('[Database] Neural Link Established');
        return mongoose;
      })
    ).then((conn) => {
      mongoCircuit.recordSuccess();
      return conn;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    mongoCircuit.recordFailure();
    throw e;
  }

  return cached.conn;
}

export async function disconnectDB() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

export default connectDB;
