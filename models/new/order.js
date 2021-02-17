const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    placedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    amount: {
      type: Number,
      required: true,
    },
    paidVia: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Created",
    },
    transactionId: {
      type: String,
    },
    merchantRequestId: {
      type: String,
    },
    checkoutRequestId: {
      type: String,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    profileName: {
      type: String,
      required: true,
    },
    center: {
      type: String,
    },
    executionDate: {
      type: String,
      required: true,
    },
    paid: {
      type: String,
    },
    services: [],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
