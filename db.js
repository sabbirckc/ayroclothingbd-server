import { MongoClient, ServerApiVersion } from 'mongodb';
import 'dotenv/config';

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI is not defined in environment variables.');
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let dbInstance = null;

export async function connectDB() {
  if (!dbInstance) {
    try {
      await client.connect();
      dbInstance = client.db('clothspaceDB');
      console.log('Successfully connected to MongoDB Atlas (clothspaceDB)!');
    } catch (error) {
      console.error('MongoDB Connection Error:', error);
      throw error;
    }
  }
  return dbInstance;
}

export function getDB() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return dbInstance;
}

export function getCollections() {
  const db = getDB();
  return {
    clothesCollection: db.collection('clothes'),
    ordersCollection: db.collection('orders'),
    usersCollection: db.collection('users'),
    wishlistCollection: db.collection('wishlist')
  };
}

export { client };
