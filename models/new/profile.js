const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const profileSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Your trusted provider",
    },
    available: {
      type: Boolean,
      default: true,
    },
    centerId: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    latitude: { type: Number },
    longitude: { type: Number },
    imageUrl: {
      type: String,
      required: true,
    },
    rating: { type: Number, default: 1 },
    jobs: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Profile", profileSchema);
