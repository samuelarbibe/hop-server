const mongoose = require('mongoose')
const { Schema } = mongoose

const cartSchema = new Schema({
  _id: String,
  items: [{
    _id: false,
    productId: String,
    amount: {
      type: Number,
      min: 0,
    },
  }],
  shippingMethod: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: Date,
  customerDetails: {
    _id: false,
    fullName: {
      type: String,
      validate: {
        validator: (value) => /^[a-z\u0590-\u05fe\s]+$/i.test(value),
        message: 'Invalid fullName'
      }
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: (value) => {
          /^[0-9]*$/.test(value) && /^\d{10}$/.test(value)
        },
        message: 'Invalid phone number'
      }
    },
    email: {
      type: String,
      validate: {
        validator: (value) => /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(value),
        message: 'Invalid email'
      }
    },
    address: String,
    houseNumber: {
      type: Number,
      min: 0,
      get: v => Math.round(v),
      set: v => Math.round(v),
    },
  },
  paymentProcess: {
    _id: false,
    url: String,
  },
  orderId: String,
})

const Cart = mongoose.model('cart', cartSchema)

module.exports = Cart