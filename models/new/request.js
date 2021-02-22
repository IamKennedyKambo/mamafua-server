const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const requestSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Request", requestSchema);
