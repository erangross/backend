const { MongoClient } = require('mongodb');

// Connection URI
const uri = 'mongodb://localhost:27017/mydb';

// Create a new MongoClient
const client = new MongoClient(uri, { useUnifiedTopology: true });

// Connect to the MongoDB server
client.connect((err) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log('Connected to MongoDB server');

  // Do something with the database here...

  // Close the connection
  client.close();
});