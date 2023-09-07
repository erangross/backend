const MongoClient = require('mongodb').MongoClient;

// Connection URL
const url = 'mongodb://127.0.0.1:27017';

// Use connect method to connect to the server
MongoClient.connect(url, { useUnifiedTopology: true }, function(err, client) {
  console.log("Connected successfully to server");
    if (err) {
        console.error(err);
        return;
    }
  const db = client.db('VitalSignAIAuth');
  db.collection('users').find({}).toArray(function(err, docs) {
    console.log("Found the following records");
    console.log(docs);
    });
    db.close();

  // Perform database operations here

  client.close();
});