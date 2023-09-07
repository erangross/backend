// Description: This file contains the routes for the chat page.
const path = require('path');
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Conversation = require('./models/conversation');
const { getUserAuthCollection, getConversationsCollection, closeConnection } = require('./db');
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

// Handle POST requests to the / endpoint
router.post('/chat', async (req, res) => {
  const message = req.body.message;
  try {
    // Get the conversations collection
    const conversationsCollection = await getConversationsCollection();

    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a professional doctor, answer medical questions only, refuse any other not related question with manners." },
        ...conversationHistory,
        { role: "user", content: message }
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 512,
      temperature: 0.1
    });
    const chatbotResponse = chatCompletion.choices[0].message["content"]
    conversationHistory.push({ role: "user", content: message });
    conversationHistory.push({ role: "assistant", content: chatbotResponse });

    // Save the conversation history to the database
    const userId = req.session.userId;
    const conversationTitle = req.session.conversationTitle;
    const conversation = await conversationsCollection.findOne({ userId: userId, title: conversationTitle });
    if (conversation) {
      conversation.conversation.push({ role: "user", content: message });
      conversation.conversation.push({ role: "assistant", content: chatbotResponse });
      await conversationsCollection.updateOne({ userId: userId, title: conversationTitle }, { $set: { conversation: conversation.messages } });
    } else {
      const userAuthCollection = await getUserAuthCollection();
      const user = await userAuthCollection.findOne({ _id: userId });
      if (user) {
        const newConversation = new Conversation({
          userId: userId,
          title: conversationTitle,
          conversation: [
            { role: "user", content: message },
            { role: "assistant", content: chatbotResponse }
          ]
        });
        await conversationsCollection.insertOne(newConversation);
      }
    }

    // If the conversation title is not set, set it to the chatbot response after the first question
    if (!req.session.conversationTitle && conversationHistory.length === 4) {
      req.session.conversationTitle = chatbotResponse;
    }

    // Close the connection to the MongoDB server
    await closeConnection();

    res.json({ response: chatbotResponse});
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

// Handle POST requests to the /chatTitle endpoint
router.post('/chatTitle', async (req, res) => {
  const message = req.body.message;
  try {
    let conversationTitle = req.session.conversationTitle;
    if (!conversationTitle) {
      // If the conversation title is not set, check if the message is a greeting or too short
      const words = message.trim().split(/\s+/);
      if (words.length <= 2 || ['hello', 'hi', 'hey'].includes(words[0].toLowerCase())) {
        // If the message is a greeting or too short, set a default conversation title
        conversationTitle = 'Request for Medical Advice and Guidance';
      } else {
        // If the message is not a greeting and long enough, generate a conversation title using GPT-3
        const chatCompletion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: "You are a professional doctor, write 5 words professional title regarding the medical message you receive " },
            { role: "user", content: message }
          ],
          model: "gpt-3.5-turbo",
          max_tokens: 128,
          temperature: 0.1
        });
        conversationTitle = chatCompletion.choices[0].message["content"].trim();
        conversationTitle = conversationTitle.replace(/^Conversation title set to: /, '')
      }
      // Save the conversation title to the session
      req.session.conversationTitle = conversationTitle;
      console.log(`Conversation title set to: ${conversationTitle}`);
    } else {
      // If the conversation title is already set, check if the message is a question
      const words = message.trim().split(/\s+/);
      if (words.length > 2 && !['hello', 'hi', 'hey'].includes(words[0].toLowerCase())) {
        // If the message is a question, overwrite the conversation title using GPT-3
        const chatCompletion = await openai.chat.completions.create({
          messages: [
            { role: "system", content: "You are a professional doctor, write one title only for the conversation" },
            { role: "user", content: message }
          ],
          model: "gpt-3.5-turbo",
          max_tokens: 128,
          temperature: 0.1
        });
        conversationTitle = chatCompletion.choices[0].message["content"].trim();
        conversationTitle = conversationTitle.replace(/^Conversation title set to: /, '')
        // Save the new conversation title to the session
        req.session.conversationTitle = conversationTitle;
        console.log(`Conversation title updated to: ${conversationTitle}`);
      }
    }
      
    // Send the conversation title in the response without the prefix "Conversation title set to: "
    res.json({ response: conversationTitle});
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

// Handle GET requests to the /conversation-history/:userId/:conversationTitle endpoint
router.get('/conversation-history/:userId/:conversationTitle', async (req, res) => {
  try {
    // Get the user ID and conversation title from the request parameters
    const userId = req.params.userId;
    const conversationTitle = req.params.conversationTitle;

    // Get the conversations collection
    const conversationsCollection = await getConversationsCollection();

    // Find the conversation in the database
    const conversation = await conversationsCollection.findOne({ userId: userId, title: conversationTitle });

    if (conversation) {
      // If the conversation exists, return the conversation history and title
      res.json({ conversationTitle: conversationTitle, conversationHistory: conversation.messages });
    } else {
      // If the conversation doesn't exist, return a default title and an empty conversation history
      res.json({ conversationTitle: 'New Conversation', conversationHistory: [] });
    }

    // Close the connection to the MongoDB server
    await closeConnection();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'InternalServerError', message: 'An internal server error occurred' });
  }
});

// Handle PUT requests to the /conversation/:userId/:conversationTitle endpoint
router.put('/conversation/:userId/:conversationTitle', async (req, res) => {
  try {
    // Get the user ID and conversation title from the request parameters
    const userId = req.params.userId;
    const conversationTitle = req.params.conversationTitle;

    // Get the message and response from the request body
    const message = req.body.message;
    const response = req.body.response;

    // Get the conversations collection
    const conversationsCollection = await getConversationsCollection();

    // Find the conversation in the database
    const conversation = await conversationsCollection.findOne({ userId: userId, title: conversationTitle });

    if (conversation) {
      // If the conversation exists, add the new message and response to the conversation
      conversation.conversation.push({ role: "user", content: message });
      conversation.conversation.push({ role: "assistant", content: response });
      await conversationsCollection.updateOne({ userId: userId, title: conversationTitle }, { $set: { conversation: conversation.messages } });
      res.json({ message: 'Conversation updated successfully' });
    } else {
      // If the conversation doesn't exist, return an error message
      res.status(404).json({ error: 'ConversationNotFound', message: 'The conversation was not found' });
    }

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