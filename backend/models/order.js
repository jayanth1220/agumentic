const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    product: String,
    quantity: Number
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
