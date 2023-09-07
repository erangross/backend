const mongoose = require('mongoose');
const Conversation = require('./models/conversation');

// Connection string for the MongoDB server
const connectionString = 'mongodb://localhost:27017/mychat';

// Connect to the MongoDB server
mongoose.connect(connectionString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');

  // Find a conversation document
  const conversation = await Conversation.findOne({ title: 'Test Conversation' });

  if (conversation) {
    console.log('Conversation:', conversation);
  } else {
    console.log('Conversation not found');
  }

  // Disconnect from the MongoDB server
  mongoose.disconnect();
}).catch((err) => {
  console.error(err);
});