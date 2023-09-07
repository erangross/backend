const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  }
});

const conversationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  messages: {
    type: [messageSchema],
    default: []
  }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  conversations: {
    type: [conversationSchema],
    default: []
  }
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;