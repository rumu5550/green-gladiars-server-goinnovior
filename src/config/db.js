const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.warn('⚠️  MONGODB_URI environment variable is missing! Check your .env file or Vercel Environment Variables.');
}

// MongoClient options - works for both local dev and Vercel serverless
const clientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 15000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 15000,
  family: 4, // Force IPv4 to avoid IPv6 DNS issues
};

// Use a cached connection to avoid creating new connections on every serverless invocation
let cachedClient = null;
let cachedClientPromise = null;

async function connectToDatabase() {
  if (cachedClient && cachedClientPromise) {
    return { client: cachedClient, clientPromise: cachedClientPromise };
  }

  const client = new MongoClient(uri, clientOptions);
  cachedClientPromise = client.connect();
  cachedClient = client;

  cachedClientPromise.catch((err) => {
    console.error('MongoDB Connection Error:', err.message);
    cachedClient = null;
    cachedClientPromise = null;
  });

  return { client: cachedClient, clientPromise: cachedClientPromise };
}

// Eagerly connect so the module-level `client` is usable by existing routes
const client = new MongoClient(uri || 'mongodb://localhost:27017', clientOptions);

const clientPromise = client.connect().catch((err) => {
  console.error('MongoDB Connection Error:', err.message);
  return null;
});

module.exports = { client, clientPromise, connectToDatabase };
