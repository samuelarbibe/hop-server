require('../src/utils/config')
const { connectDb } = require('../src/server')

const Cart = require('../src/models/Cart')
const Product = require('../src/models/Product')
const ShippingMethod = require('../src/models/ShippingMethod')

const mongoURI = process.env.MONGO_URI
connectDb(mongoURI)

afterEach(async () => {
  await Cart.deleteMany({})
  await Product.deleteMany({})
  await ShippingMethod.deleteMany({})
})