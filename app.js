const express = require('express');
const session = require('express-session');
const uuid = require('uuid').v4; // Import the uuid package
const app = express();
const fs = require('fs');
const https = require('https');
const morgan = require('morgan');
const signup = require('./signup');
const login = require('./login');
const chat = require('./chat');
const path = require('path');
const http = require('http');
const { MongoClient } = require('mongodb');

// Add session middleware with a random UUID as the secret key
app.use(session({
  genid: () => uuid(), // Generate a random UUID for each session
  secret: uuid(), // Use a random UUID as the secret key
  resave: false,
  saveUninitialized: true
}));


// Name of the database and collection for the UserAuth collection
const userAuthDbName = 'vitalsignaiauth';
const userAuthCollName = 'userauth';

// Name of the database and collection for the Conversation collection
const conversationDbName = 'mychat';
const conversationCollName = 'conversations';

// Connection URI for the MongoDB database
const uri = 'mongodb://127.0.0.1:27017/';
// Create a new MongoClient instance
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  monitorCommands: true
});
console.log('Created MongoClient');

// Connect to the MongoDB server
async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log('Connected to MongoDB server');
    // Log the command started events
    client.on('commandStarted', started => console.log(started));
    // Get the list of databases on the server
    const dbList = await client.db().admin().listDatabases();
    // Check if the UserAuth database exists
    const userAuthDbExists = dbList.databases.some(db => db.name === userAuthDbName);
    if (!userAuthDbExists) {
      // Create the UserAuth database if it does not exist
      await client.db(userAuthDbName).createCollection(userAuthCollName);
      console.log(`Created database ${userAuthDbName}`);
    }
    // Check if the UserAuth collection exists
    const userAuthCollList = await client.db(userAuthDbName).listCollections().toArray();
    const userAuthCollExists = userAuthCollList.some(coll => coll.name === userAuthCollName);
    if (!userAuthCollExists) {
      // Create the UserAuth collection if it does not exist
      await client.db(userAuthDbName).createCollection(userAuthCollName);
      console.log(`Created collection ${userAuthCollName}`);
    } else {
      console.log(`Using collection ${userAuthCollName}`);
    }
    
    // Create a unique index on the email field for the UserAuth collection
    const userAuthColl = client.db(userAuthDbName).collection(userAuthCollName);
    const userAuthIndexSpec = { email: 1 };
    const userAuthIndexOptions = { unique: true };

    // Check if the index already exists
    const userAuthIndexExists = await userAuthColl.indexExists('email_1');
    if (userAuthIndexExists) {
      console.log(`Index on field email for ${userAuthCollName} collection already exists`);
    } else {
      // Create the index if it does not exist
      await userAuthColl.createIndex(userAuthIndexSpec, userAuthIndexOptions);
      console.log(`Created unique index on field email for ${userAuthCollName} collection`);
    }

    // Check if the Conversation database exists
    const conversationDbExists = dbList.databases.some(db => db.name === conversationDbName);
    if (!conversationDbExists) {
      // Create the Conversation database if it does not exist
      await client.db(conversationDbName).createCollection(conversationCollName);
      console.log(`Created database ${conversationDbName}`);
    }
    // Check if the Conversation collection exists
    const conversationCollList = await client.db(conversationDbName).listCollections().toArray();
    const conversationCollExists = conversationCollList.some(coll => coll.name === conversationCollName);
    if (!conversationCollExists) {
      // Create the Conversation collection if it does not exist
      await client.db(conversationDbName).createCollection(conversationCollName);
      console.log(`Created collection ${conversationCollName}`);
    } else {
      console.log(`Using collection ${conversationCollName}`);
    }
    
    // Create a unique index on the title field for the Conversation collection
    const conversationColl = client.db(conversationDbName).collection(conversationCollName);
    const conversationIndexSpec = { title: 1 };
    const conversationIndexOptions = { unique: true };

    // Check if the index already exists
    const conversationIndexExists = await conversationColl.indexExists('title_1');
    if (conversationIndexExists) {
      console.log(`Index on field title for ${conversationCollName} collection already exists`);
    } else {
      // Create the index if it does not exist
      await conversationColl.createIndex(conversationIndexSpec, conversationIndexOptions);
      console.log(`Created unique index on field title for ${conversationCollName} collection`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

// Add the following line to disable favicon requests
app.get('/favicon.ico', (req, res) => res.status(204));

// Serve static files from the web folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve static files from the css folder
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));

// Logging middleware
app.use(morgan('dev'));

// Body parsing middleware
app.use(express.json());

// Handle GET requests to the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/welcome.html'));
});

// Handle  requests to the /signup endpoint
app.use('/', signup);

// Handle  requests to the /login endpoint
app.use('/', login);

// Handle  requests to the /chat endpoint
app.use('/', chat);



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error occurred on ${req.method} ${req.url}: ${err.stack}`);
  res.status(500).json({ error: `An error occurred: ${err.message}`, stack: err.stack });
  next(err);
});

const options = {
  cert: fs.readFileSync('../keys/server.crt'),
  key: fs.readFileSync('../keys/server.key')
};

const server = https.createServer(options, app);

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.listen(443, 'localhost', () => {
  console.log('Server listening on https://localhost:443');
});