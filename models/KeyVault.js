const mongoose = require('mongoose');

const keyVaultSchema = new mongoose.Schema({
  keyId: {
    type: Buffer,
    required: true,
    unique: true,
  },
  keyAltNames: {
    type: [String],
    required: true,
  },
  algorithm: {
    type: String,
    required: true,
  },
  provider: {
    type: String,
    required: true,
  },
  masterKey: {
    type: Buffer,
    required: true,
  },
});

const KeyVault = mongoose.model('KeyVault', keyVaultSchema, 'keyvault');

module.exports = KeyVault;