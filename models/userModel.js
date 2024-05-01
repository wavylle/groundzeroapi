const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  customer_id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  broker: {
    type: String,
    required: true,
  },
  broker_user_id: {
    type: String,
    required: true,
  },
  enc_token: {
    type: String,
  },
  is_authenticated: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Number,
    default: Date.now(),
  },
});

module.exports = mongoose.model("User", userSchema);
