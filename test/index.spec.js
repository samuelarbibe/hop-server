require('../src/utils/config')
const { connectDb } = require('../src/server')

const Cart = require('../src/models/Cart')
const Product = require('../src/models/Product')
const ShippingMethod = require('../src/models/ShippingMethod')
const User = require('../src/models/User')

const mongoURI = process.env.MONGO_URI
connectDb(mongoURI)

beforeEach(async () => {
  await User.register({ username: 'username' }, 'password')
})

afterEach(async () => {
  await User.deleteMany({})
  await Cart.deleteMany({})
  await Product.deleteMany({})
  await ShippingMethod.deleteMany({})
})