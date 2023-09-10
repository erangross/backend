const mongoose = require('mongoose');

const userAuthSchema = new mongoose.Schema({
  email: {
    type: 'string',
    required: true,
    unique: true
  },
  enabled: {
    type: 'boolean',
    required: true
  },
  lastLoginDate: {
    type: 'date',
    default: null
  },
  passwordHash: {
    type: 'string',
    required: true
  },
  numPasswordFailures: {
    type: 'number',
    default: 0
  },
  confirmEmail: {
    type: 'boolean',
    required: true
  },
  signupDate: {
    type: 'date',
    required: true
  },
  emailVerificationToken: {
    type: 'string',
    default: null
  },
  encryptionKey: {
    type: 'string',
    required: true
  },
  encryptionIV: {
    type: 'string',
    required: true
  }
});

const UserAuth = mongoose.model('UserAuth', userAuthSchema);

module.exports = UserAuth;