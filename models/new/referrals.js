const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const referralSchema = new Schema(
  {
    referrer: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    validFor: { type: String, required: true },
    code: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Referrals", referralSchema);
