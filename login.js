const path = require('path');
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');
const { isValidEmail, isValidPassword } = require('./utils/validation');
const e = require('express');

const url = 'mongodb://127.0.0.1:27017';
const dbName = 'vitalsignaiauth';
const collectionName = 'userauth';

// Use body-parser middleware to parse JSON data
router.use(bodyParser.json());

// Add the following line to disable favicon requests
router.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Handle GET requests to the /login endpoint
router.get('/login', (req, res) => {
  // console.log('Received login GET request:', req);
   res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
 });
 // Serve login-style.css
 router.get('login/css/login-style.css', (req, res) => {
   res.sendFile(path.join(__dirname, '..', 'web', 'css', 'login-style.css'));
 });  
router.post('/login', async (req, res) => {
  console.log('Received login POST request:', req.body);
  const email = req.body.email.trim();
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).json({ error: 'Please enter all required fields.' });
  } else if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
  } else if (!isValidPassword(password)) {
    res.status(400).json({ error: 'Please enter a valid password.' });
  } else {
    try {
      // Connect to MongoDB database
      const client = await MongoClient.connect(url, { useUnifiedTopology: true });
      console.log('Connected to MongoDB database');

      const db = client.db(dbName);
      const userCollection = db.collection(collectionName);
      console.log('Using collection:', collectionName);
      const query = { email: email};
      const options = { projection: { _id: 1, email: 1, passwordHash: 1 } };
      // Find user by email
      console.log('Finding user with email:', email);
      const user = await userCollection.findOne(query, options);
      console.log('Found user:', user);
      if (!user) {
        console.log('User not found. Returning 401 Unauthorized.');
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      // Compare password with hashed password
      console.log('Comparing password with hashed password.');
      const result = await bcrypt.compare(password, user.passwordHash);
      console.log('Password comparison result:', result);
      if (!result) {
        console.log('Password does not match. Returning 401 Unauthorized.');
        res.status(401).json({ error: 'Invalid email or password.' });
        return;
      }

      // Create a session for the user
      if (req.session) {
        try{
          req.session.userId = user._id;
        } catch (err) {
          console.error(err);
          console.log('Session object is undefined or null. Cannot create session.');
          res.status(500).json({ error: 'An error occurred. Please try again later.', details: err });
          return;
        }
      } 
      console.log('Sending login response:', { message: 'Login successful.' });
      res.status(200).json({ message: 'Login successful.', userId: user._id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'An error occurred. Please try again later.' });
    }
  }
});

module.exports = router;