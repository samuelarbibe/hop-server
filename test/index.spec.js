require('../src/utils/config')
const Cart = require('../src/models/Cart')
const Product = require('../src/models/Product')
const { connectDb } = require('../src/server')

const mongoURI = process.env.MONGO_URI
connectDb(mongoURI)

afterEach(async () => {
  await Product.deleteMany({})
  await Cart.deleteMany({})
})