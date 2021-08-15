const mongoose = require('mongoose')
const { Schema } = mongoose

const orderSchema = new Schema({
  transaction: Schema.Types.Mixed,
  cart: Schema.Types.Mixed,
  paymentProcess: Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['approved', 'pending', 'cancelled']
  }
})

const Order = mongoose.model('order', orderSchema)

module.exports = Order