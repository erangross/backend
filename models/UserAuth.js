const mongoose = require('mongoose');

const userAuthSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  enabled: {
    type: Boolean,
    required: true
  },
  lastLoginDate: {
    type: Date,
    default: null
  },
  passwordHash: {
    type: String,
    required: true
  },
  numPasswordFailures: {
    type: Number,
    default: 0
  },
  confirmEmail: {
    type: Boolean,
    required: true
  },
  signupDate: {
    type: Date,
    required: true
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  encryptionKey: {
    type: String,
    required: true
  },
  encryptionIV: {
    type: String,
    required: true
  }
});

const UserAuth = mongoose.model('UserAuth', userAuthSchema);

module.exports = UserAuth;