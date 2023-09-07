// Import the required modules
const { MongoClient } = require('mongodb');

// Define the MongoDB connection string and database name
const url = 'mongodb://127.0.0.1:27017';
const dbName = 'vitalsignaiauth';

// Define the name of the collection to use
const collectionName = 'users';

// Define the function to find a user by email
async function findUserByEmail(email) {
  // Connect to the MongoDB database
  const client = await MongoClient.connect(url, { useUnifiedTopology: true });
  console.log('Connected to MongoDB database');

  // Get a reference to the users collection
  const db = client.db(dbName);
  const userCollection = db.collection(collectionName);
  console.log('Using collection:', collectionName);

  // Define the query to find the user by email
  const query = { email: email };

  // Define the options to include only the email and password fields
  const options = { projection: { _id: 0, email: 1, password: 1 } };

  // Find the user by email
  console.log('Finding user with email:', email);
  const user = await userCollection.findOne(query, options);
  console.log('Found user:', user);

  // Close the MongoDB connection
  await client.close();

  // Return the user object
  return user;
}

// Call the function to find the user by email
findUserByEmail('test5@gmail.com')
  .then((user) => {
    console.log('User:', user);
  })
  .catch((err) => {
    console.error(err);
  });