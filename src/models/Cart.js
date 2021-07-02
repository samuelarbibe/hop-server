const mongoose = require('mongoose')
const { Schema } = mongoose

const cartSchema = new Schema({
  _id: String,
  items: [{
    _id: false,
    productId: String,
    amount: Number,
  }],
  shippingMethod: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  customerDetails: {
    _id: false,
    address: String,
    houseNumber: Number,
  }
})

const Cart = mongoose.model('cart', cartSchema)

module.exports = Cart