const mongoose = require('mongoose')
const csvtojson = require('csvtojson')
const mongooseToCsv = require('mongoose-to-csv')

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

const csvFormat = {
  headers: 'Name Price Stock',
  constraints: {
    'Name': 'name',
    'Price': 'price',
    'Stock': 'stock',
  },
}

productSchema.plugin(mongooseToCsv, csvFormat)

productSchema.static('insertManyFromCsv', async (csvData) => {
  const productsToInsert = await csvtojson({
    headers: Object.values(csvFormat.constraints)
  }).fromString(csvData)

  return Product.insertMany(productsToInsert)
})

const Product = mongoose.model('product', productSchema)

module.exports = Product