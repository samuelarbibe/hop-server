const nock = require('nock')
const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const { request, expect } = chai
const { ObjectId } = require('mongodb')

const { createServer } = require('../src/server')
const app = createServer(true)

const Cart = require('../src/models/Cart')
const Order = require('../src/models/Order')
const Product = require('../src/models/Product')
const ShippingMethod = require('../src/models/ShippingMethod')

const products = require('./testData/products')
const shippingMethods = require('./testData/shippingMethods')
const customerDetails = require('./testData/customerDetails')

const { login, logout } = require('./utils/users')

const { MESHULAM_API_BASE_URL } = process.env

describe('Orders', () => {
  describe('Order handling', () => {
    beforeEach(async () => {
      const [product] = await Product.insertMany(products)
      const [shippingMethod] = await ShippingMethod.insertMany(shippingMethods)

      await request(app).put(`/api/cart/product/${product._id.toString()}`)
      await request(app).put(`/api/cart/shippingMethod/${shippingMethod._id.toString()}`)
      await request(app).put('/api/cart/customerDetails').send(customerDetails.details)
    })

    afterEach(async () => {
      nock.cleanAll()

      await Cart.deleteMany()
      await Order.deleteMany()
      await Product.deleteMany()
      await ShippingMethod.deleteMany()
    })

    describe('GET /createOrder', () => {
      it('Should create order', async () => {
        const mockedReply = {
          status: 1,
          data: { url: 'url' }
        }
        nock(MESHULAM_API_BASE_URL)
          .post('/createPaymentProcess')
          .reply(200, mockedReply)

        const res = await request(app)
          .get('/api/orders/createOrder')

        expect(res).to.have.status(200)
        expect(res.body).to.deep.equal(mockedReply.data)

        const { body: updatedCart } = await request(app).get('/api/cart')
        expect(updatedCart.orderId).to.exist

        const order = await Order.findById(updatedCart.orderId).lean()
        expect(order.cart._id).to.equal(updatedCart._id)
        expect(order.paymentProcess).to.deep.equal(mockedReply.data)
        expect(order.status).to.equal('pending')
      })

      it('Should return url if already exists in cart and order status is pending', async () => {
        const { body: cart } = await request(app).get('/api/cart')

        const paymentProcess = { url: 'url' }
        const order = await Order.create({ paymentProcess, status: 'pending' })
        await Cart.findByIdAndUpdate(cart._id, { $set: { orderId: order._id.toString() } })

        const res = await request(app)
          .get('/api/orders/createOrder')

        expect(res).to.have.status(200)
        expect(res.body).to.deep.equal(paymentProcess)
      })
    })

    describe('DELETE /cancelOrder', () => {
      it('Should cancel existing order', async () => {
        const mockedReply = {
          status: 1,
          data: { url: 'url' }
        }
        nock(MESHULAM_API_BASE_URL)
          .post('/createPaymentProcess')
          .reply(200, mockedReply)

        await request(app).get('/api/orders/createOrder')

        const res = await request(app).delete('/api/orders/cancelOrder')
        expect(res).to.have.status(200)

        const updatedCart = res.body
        const order = await Order.findById(updatedCart.orderId).lean()
        expect(order.status).to.equal('cancelled')
      })

      it('Should fail if cart has no orderId', async () => {
        const res = await request(app)
          .delete('/api/orders/cancelOrder').catch((err) => err)

        expect(res).to.have.status(404)
      })
    })

    describe('POST /updateStatus', () => {
      it('Should approve transaction on server side', async () => {
        const mockedReply = {
          status: 1,
          data: { url: 'url' }
        }
        nock(MESHULAM_API_BASE_URL)
          .post('/createPaymentProcess')
          .reply(200, mockedReply)

        await request(app).get('/api/orders/createOrder')
        const { body: updatedCart } = await request(app).get('/api/cart')

        nock(MESHULAM_API_BASE_URL).post('/approveTransaction').reply(200, { status: 1 })
        const body = {
          data: {
            customFields: {
              cField1: updatedCart.orderId,
              cField2: updatedCart._id
            },
            transactionId: 'xxx'
          }
        }

        const res = await request(app)
          .post('/api/orders/updateStatus')
          .send(body)

        expect(res).to.have.status(200)

        const carts = await Cart.find({})
        const [product] = await Product.find({})
        const [shippingMethod] = await ShippingMethod.find({})
        const updatedOrder = await Order.findById(updatedCart.orderId)

        expect(product.stock).to.equal(products[0].stock - 1)
        expect(product.stock).to.equal(product.tempStock)

        expect(shippingMethod.stock).to.equal(shippingMethods[0].stock - 1)
        expect(shippingMethod.stock).to.equal(shippingMethod.tempStock)

        expect(updatedOrder.status).to.equal('approved')

        expect(carts.length).to.equal(0)
      })
    })
  })

  describe('GET /all', () => {
    it('Should return all', async () => {
      const agent = chai.request.agent(app)
      await login(agent)

      const ordersToInsert = [1, 2, 3].map(() => ({ status: 'approved' }))
      const orders = await Order.insertMany(ordersToInsert)

      const response = await agent.get('/api/orders/all')

      expect(response).to.have.status(200)
      expect(response.body.length).to.equal(orders.length)

      await logout(agent)
    })

    it('Should return all of noted status', async () => {
      const agent = chai.request.agent(app)
      await login(agent)

      const approvedOrders = [1, 2, 3].map(() => ({ status: 'approved' }))
      const cancelledOrders = [1, 2, 3].map(() => ({ status: 'cancelled' }))
      await Order.insertMany([...approvedOrders, ...cancelledOrders])

      const response = await agent.get('/api/orders/all?status=approved')

      expect(response).to.have.status(200)
      expect(response.body.length).to.equal(approvedOrders.length)

      await logout(agent)
    })

    it('should unauthorize if not admin', async () => {
      const response = await request(app).get('/api/orders/all')
      expect(response).to.have.status(403)
    })
  })

  describe('GET /:id', () => {
    it('Should return by id', async () => {
      const agent = chai.request.agent(app)
      await login(agent)

      const order = await Order.create({ status: 'approved' })

      const response = await agent.get(`/api/orders/${order._id.toString()}`)

      expect(response).to.have.status(200)
      expect(response.body.status).to.equal('approved')

      await logout(agent)
    })

    it('Should return 404 if not found', async () => {
      const agent = chai.request.agent(app)
      await login(agent)

      const fakeId = ObjectId()
      const response = await agent.get(`/api/orders/${fakeId}`)
      expect(response).to.have.status(404)

      await logout(agent)
    })

    it('should unauthorize if not admin', async () => {
      const order = await Order.create({ status: 'approved' })

      const response = await request(app).get(`/api/orders/${order._id.toString()}`)
      expect(response).to.have.status(403)
    })
  })
})