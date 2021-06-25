const mongoose = require('mongoose')

const { Schema } = mongoose

const ShippingMethodSchema = new Schema({
  name: String,
  type: String,
  price: Number,
  stock: Number,
  freeAbove: Number,
  tempStock: {
    type: Number,
    default: () => this.stock,
  },
  from: Date,
  to: Date,
  description: String,
})

const ShippingMethod = mongoose.model('shippingMethod', ShippingMethodSchema, 'shippingMethods')

module.exports = ShippingMethod