const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const serviceSchema = new Schema(
  {
    name: {
      type: String,
    },
    onSitePrice: {
      type: Number,
    },
    machinePrice: {
      type: Number,
    },
    offSitePrice: {
      type: Number,
    },
    // isPackage: {
    //     type: Boolean,
    //     required: true,
    //     default: false
    // },
    // isDelivery: {
    //     type: Boolean,
    //     required: true,
    //     default: false
    // },
    description: {
      type: String,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    offerPc: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", serviceSchema);
