const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const receiptSchema = new Schema({
  number: {
    type: String,
    required: true,
  },
  transactionId: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  merchantRequestId: {
    type: String,
    required: true,
  },
  checkoutRequestId: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Receipt", receiptSchema);
