const MongoClient = require('mongodb').MongoClient;

// Connection URL and database name
const url = 'mongodb://127.0.0.1:27017';
const authdbName = 'vitalsignaiauth';
const conversationDbName = 'mychat';
// Create a new MongoClient
const client = new MongoClient(url);

// Connect to the MongoDB server and return the userauth collection
async function getUserAuthCollection() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected successfully to MongoDB server');

    // Get the userauth collection from the database
    const db = client.db(authdbName);
    const userAuthColl = db.collection('userauth');

    return userAuthColl;
  } catch (err) {
    console.error('Error connecting to MongoDB server:', err);
    throw err;
  }
}

// Connect to the MongoDB server and return the conversations collection
async function getConversationsCollection() {
  try {
    // Connect to the MongoDB server
    await client.connect();
    console.log('Connected successfully to MongoDB server');

    // Get the conversations collection from the database
    const db = client.db(conversationDbName);
    const conversationsColl = db.collection('conversations');

    return conversationsColl;
  } catch (err) {
    console.error('Error connecting to MongoDB server:', err);
    throw err;
  }
}


// Close the connection to the MongoDB server
async function closeConnection() {
  try {
    await client.close();
    console.log('Closed connection to MongoDB server');
  } catch (err) {
    console.error('Error closing connection to MongoDB server:', err);
    throw err;
  }
}

// Export the getUserAuthCollection and closeConnection functions
module.exports = { getUserAuthCollection,getConversationsCollection, closeConnection };