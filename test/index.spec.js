require('../src/utils/config')
const { connectDb } = require('../src/server')

const Cart = require('../src/models/Cart')
const User = require('../src/models/User')
const Const = require('../src/models/Const')
const Order = require('../src/models/Order')
const Product = require('../src/models/Product')
const ShippingMethod = require('../src/models/ShippingMethod')

const mongoURI = process.env.MONGO_URI
connectDb(mongoURI)

before(async () => {
  await Const.create({ _id: 'cart_time_to_expire', value: 100 })
})

beforeEach(async () => {
  await User.register({ username: 'username' }, 'password')
})

afterEach(async () => {
  await User.deleteMany({})
  await Cart.deleteMany({})
  await Order.deleteMany({})
  await Product.deleteMany({})
  await ShippingMethod.deleteMany({})
})

after(async () => {
  await Const.deleteMany({})
})