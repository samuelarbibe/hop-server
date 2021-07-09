const mongoose = require('mongoose')
const { Schema } = mongoose

const productSchema = new Schema({
  name: String,
  price: Number,
  stock: Number,
  tempStock: {
    type: Number,
    default: () => this.stock,
  },
  images: [String],
  description: String,
})

const Product = mongoose.model('product', productSchema)

module.exports = Product