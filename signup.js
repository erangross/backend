const path = require('path');
const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { isValidEmail, isValidPassword, isValidConfirmPassword } = require('./utils/validation');
const UserAuth = require('./models/UserAuth');
const saltRounds = 10;
const { getUserAuthCollection, closeConnection } = require('./db');

// Use body-parser middleware to parse JSON data
router.use(bodyParser.json());

// Handle GET requests to the /signup endpoint
router.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'signup.html'));
});

// Serve signup-style.css
router.get('/signup/css/signup-style.css', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'web', 'css', 'signup-style.css'));
});

// Handle POST requests to the /signup endpoint
router.post('/signup', async (req, res) => {
  console.log('Received signup POST request:', req.body);
  try {
    // Receive the email and password fields from the client
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    // Validate the email address
    if (!isValidEmail(email)) {
      console.log('Invalid email address:', email);
      return res.status(400).json('Invalid email address');
    }

    // Validate the password
    if (!isValidPassword(password)) {
      console.log('Invalid password:', password);
      return res.status(400).json('Invalid password');
    }

    // Validate the confirm password
    if (!isValidConfirmPassword(password, confirmPassword)) {
      console.log('Passwords do not match');
      return res.status(400).json('Passwords do not match');
    }

    // Get the userauth collection from the database
    const userAuthColl  = await getUserAuthCollection();

    // Check if user already exists
    const existingUser = await userAuthColl.findOne({ email: email });
    if (existingUser) {
      await closeConnection();
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash the password using bcrypt
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create a new UserAuth document with the email and hashed password
    const userAuth = new UserAuth({
      email: email,
      enabled: true,
      lastLoginDate: null,
      passwordHash: hashedPassword,
      numPasswordFailures: 0,
      confirmEmail: false,
      signupDate: new Date(),
      emailVerificationToken: null,
    });

    // Save the UserAuth document to the database
    const result = await userAuthColl.insertOne(userAuth);
    console.log('Inserted UserAuth document into the userAuth collection:', result);

    // Close the connection
    await closeConnection();
    

    // Send an email verification message to the user's email address
    // await emailVerification.sendVerificationEmail('localhost@localhost.com', req.body.email, hashedPassword);

    // Return a success message
    res.status(200).json('User created successfully');
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json('Internal server error');
  }
});

// Export the router object
module.exports = router;