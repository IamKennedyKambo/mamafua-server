const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    placedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
      required: true,
    },
    fullfillerId: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    fullfillerName: {
      type: String,
      required: true,
    },
    center: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    latitude: { type: Number },
    longitude: { type: Number },
    deliveryDate: {
      type: String,
    },
    services: [],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
