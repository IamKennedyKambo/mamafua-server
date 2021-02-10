const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    username: {
      type: String,
    },
    phone: {
      type: String,
    },
    points: {
      type: Number,
      required: true,
      default: 10,
    },
    latitude: { type: Number },
    longitude: { type: Number },
    locationName: { type: String, default: "" },
    requesting: { type: Boolean, default: false },
    referrer: {
      type: String,
    },
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
