const { MongoClient, ServerApiVersion } = require('mongodb');
const dns = require('dns');

// Safely set DNS resolvers for Windows/Node.js querySrv lookup
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {
  console.warn('DNS resolver setting warning:', err.message);
}

const uri = process.env.MONGODB_URI;

let client;
let clientPromise;

if (!uri) {
  console.warn('⚠️ MONGODB_URI environment variable is missing!');
}

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });
    global._mongoClientPromise = client.connect().catch((err) => {
      console.error('MongoDB Connection Error:', err.message);
      return null;
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri || 'mongodb://localhost:27017', {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  clientPromise = client.connect().catch((err) => {
    console.error('MongoDB Connection Error:', err.message);
    return null;
  });
}

module.exports = { client, clientPromise };
