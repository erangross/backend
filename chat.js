// Description: This file contains the routes for the chat page.
const path = require('path');
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Conversation = require('./models/Conversation');
const { getUserAuthCollection, getConversationsCollection, closeConnection } = require('./db');
const { Console } = require('console');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

let conversationHistory = [];

// Add the following line to disable favicon requests
router.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Handle GET requests to the /chat endpoint
router.get('/chat', (req, res) => {
  // Check if the user is logged in
  if (!req.session.userId) {
    // If the user is not logged in, redirect them to the login page
    res.redirect('/login');
    return;
  }

  // If the user is logged in, send the chat.html file to the client
  res.sendFile(path.join(__dirname, '..', 'frontend', 'chat.html'));
});

// Serve chat-style.css
router.get('chat/css/chat-style.css', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'web', 'css', 'chat-style.css'));
});

router.post('/chat', async (req, res) => {
  const message = req.body.message;
  try {
    // Get the chatbot's response to the user's message
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a professional doctor, answer medical questions only, refuse any other not related question with manners." },
        ...conversationHistory,
        { role: "user", content: message }
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 256,
      temperature: 0.1
    });
    const chatbotResponse = chatCompletion.choices[0].message["content"]
    conversationHistory.push({ role: "user", content: message });
    conversationHistory.push({ role: "assistant", content: chatbotResponse });

    // Send the chatbot's response to the client
    res.json({ response: chatbotResponse });
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      const statusCode = err.status;
      const errorType = err.name;
      const errorMessage = err.message;
      res.status(statusCode).json({ error: errorType, message: errorMessage });
    } else {
      console.error(err);
      res.status(500).json({ error: 'InternalServerError', message: 'An internal server error occurred' });
    }
  }
});

router.post('/chatTitle', async (req, res) => {
  const userQuestion = req.body.message;
  const botAnswer = req.body.responseData;
  try {
    // Check if the user input is a real question
    const words = userQuestion.trim().split(' ');
    const isRealQuestion = words.length > 2 && !['hi', 'hey', 'hello', 'hola'].includes(words[0].toLowerCase());

    // Generate a conversation title using the OpenAI API if the user input is a real question
    let conversationTitle = '';
    if (isRealQuestion) {
      const titleCompletion = await openai.chat.completions.create({
        messages: [
          { role: "system", content: "create title with four words only from the answer" },
          { role: "user", content: botAnswer }
        ],
        model: "gpt-3.5-turbo",
        max_tokens: 128,
        temperature: 0.1
      });
      const conversationTitleRaw = titleCompletion.choices[0].message["content"];
      conversationTitle = conversationTitleRaw
    } else {
      conversationTitle = 'Untitled Conversation';
    }
    // Send the conversation title to the client
    res.json({ response: conversationTitle });
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      const statusCode = err.status;
      const errorType = err.name;
      const errorMessage = err.message;
      res.status(statusCode).json({ error: errorType, message: errorMessage });
    } else {
      console.error(err);
      res.status(500).json({ error: 'InternalServerError', message: 'An internal server error occurred' });
    }
  }
});

// Handle POST requests to the /saveMessage endpoint
router.post('/saveMessage', async (req, res) => {
  const userId = req.body.userId;
  const conversationTitle = req.body.conversationTitle;
  const message = req.body.message;
  const response = req.body.response;
  try {
    // Get the conversations collection
    const conversationsCollection = await getConversationsCollection();

    // Check if a conversation with the given title and user ID already exists in the database
    let conversation = await conversationsCollection.findOne({ userId: userId, title: conversationTitle });
    if (conversation) {
      conversation.messages.push({ role: "user", content: message });
      conversation.messages.push({ role: "assistant", content: response });
      await conversationsCollection.updateOne({ _id: conversation._id }, { $set: { messages: conversation.messages } });
    } else {
      // Check if a conversation with the 'Untitled Conversation' title and user ID already exists in the database
      conversation = await conversationsCollection.findOne({ userId: userId, title: 'Untitled Conversation' });
      if (conversation) {
        // If the conversation exists, update its title to the new title received from the client and add the new message and response to it
        conversation.title = conversationTitle;
        conversation.messages.push({ role: "user", content: message });
        conversation.messages.push({ role: "assistant", content: response });
        await conversationsCollection.updateOne({ _id: conversation._id }, { $set: { title: conversation.title, messages: conversation.messages } });
      } else {
        // If the conversation does not exist, create a new conversation with the given title and user ID
        const newConversation = new Conversation({
          userId: userId,
          title: conversationTitle,
          messages: [
            { role: "user", content: message },
            { role: "assistant", content: response }
          ]
        });
        await conversationsCollection.insertOne(newConversation);
      }
    }

    // Close the connection to the MongoDB server
    await closeConnection();

    // Send a response to the client
    res.json({ message: 'Message saved to database' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'InternalServerError', message: 'An internal server error occurred' });
  }
});

// Handle GET requests to the /conversations/:userId endpoint
router.get('/conversations/:userId', async (req, res) => {
  try {
    // Get the user ID from the request parameters
    const userId = req.params.userId;

    // Get the conversations collection
    const conversationsCollection = await getConversationsCollection();

    // Find all conversations for the user in the database
    const conversations = await conversationsCollection.find({ userId: userId }).toArray();

    // Return the list of conversations
    res.json({ conversations: conversations });

    // Close the connection to the MongoDB server
    await closeConnection();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'InternalServerError', message: 'An internal server error occurred' });
  }
});

// Handle POST requests to the /conversation endpoint
router.post('/conversation', async (req, res) => {
  try {
    // Get the user ID, conversation title, and conversation data from the request body
    const userId = req.body.userId;
    const conversationTitle = req.body.title;
    const conversationData = req.body.conversation;

    // Get the user auth collection
    const userAuthCollection = await getUserAuthCollection();

    // Check if the user exists in the database
    const user = await userAuthCollection.findOne({ _id: userId });

    if (user) {
      // If the user exists, create a new conversation with the given title and user ID
      const conversationsCollection = await getConversationsCollection();
      const newConversation = new Conversation({
        userId: userId,
        title: conversationTitle,
        conversation: conversationData
      });
      await conversationsCollection.insertOne(newConversation);
      res.json({ message: 'Conversation created successfully' });
    } else {
      // If the user doesn't exist, return an error message
      res.status(404).json({ error: 'UserNotFound', message: 'The user was not found' });
    }

    // Close the connection to the MongoDB server
    await closeConnection();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'InternalServerError', message: 'An internal server error occurred' });
  }
});

module.exports = router;