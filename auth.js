// Import the required modules
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// Define the MongoDB connection string and database name
const url = 'mongodb://localhost:27017';
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

// Define the function to authenticate a user
async function authenticateUser(email, password) {
  // Find the user by email
  const user = await findUserByEmail(email);

  // If the user is not found, return an error
  if (!user) {
    console.log('User not found. Returning 401 Unauthorized.');
    return { error: 'Invalid email or password.' };
  }

  // Compare the password with the hashed password
  console.log('Comparing password with hashed password.');
  const result = await bcrypt.compare(password, user.password);
  console.log('Password comparison result:', result);

  // If the passwords do not match, return an error
  if (!result) {
    console.log('Password does not match. Returning 401 Unauthorized.');
    return { error: 'Invalid email or password.' };
  }

  // If the passwords match, return a success message
  console.log('Sending login response:', { message: 'Login successful.' });
  return { message: 'Login successful.' };
}

// Export the functions
module.exports = { findUserByEmail, authenticateUser };