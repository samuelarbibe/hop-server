require('mongoose-geojson-schema')
const mongoose = require('mongoose')

const { Schema } = mongoose

const ShippingMethodSchema = new Schema({
  name: String,
  type: {
    type: String,
    enum: ['delivery', 'pickup']
  },
  price: { type: Number, min: 0 },
  stock: { type: Number, min: 0 },
  freeAbove: Number,
  tempStock: {
    type: Number,
    default: () => this.stock,
  },
  from: Date,
  to: Date,
  description: String,
  area: Schema.Types.MultiPolygon
})

const ShippingMethod = mongoose.model('shippingMethod', ShippingMethodSchema, 'shippingMethods')

module.exports = ShippingMethod