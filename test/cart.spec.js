const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const { request, expect } = chai

const Product = require('../src/models/Product')
const { createServer } = require('../src/server')
const app = createServer(true)

const products = require('./testData/products')

describe('Cart', () => {
  describe('GET /', () => {
    it('Should return cart', (done) => {
      request(app)
        .get('/cart')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          done()
        })
    })
  })

  describe('PUT /:id', () => {
    let insertedProducts

    beforeEach(async () => {
      await Product.deleteMany()
      insertedProducts = await Product.insertMany(products)
    })

    it('Should add new item for product', async () => {
      const product = insertedProducts[0]
      const amount = product.stock - 1

      const res = await request(app)
        .put(`/cart/${product._id.toString()}?amount=${amount}`)
      expect(res).to.have.status(200)
      expect(res.body.items[0].productId).to.equal(product._id.toString())
      expect(res.body.items[0].amount).to.equal(amount)

      const doc = await Product.findById(product._id)
      expect(doc.tempStock).to.equal(doc.stock - amount)
    })

    it('Should return error if not enough in stock', async () => {
      const product = insertedProducts[0]
      const amount = product.stock + 1

      const res = await request(app)
        .put(`/cart/${product._id.toString()}?amount=${amount}`)
      expect(res).to.have.status(409)

      const addedProduct = await Product.findById(product._id)
      expect(addedProduct.tempStock).to.equal(addedProduct.stock)
    })
  })

  describe('DELETE /:id', () => {
    let insertedProducts

    beforeEach(async () => {
      await Product.deleteMany()
      insertedProducts = await Product.insertMany(products)

      const productInCart = insertedProducts[0]
      const amountInCart = productInCart.stock
      await request(app).put(`/cart/${productInCart._id.toString()}?amount=${amountInCart}`)
    })

    it('Should remove item from cart and restock', async () => {
      const product = insertedProducts[0]
      const amountToRemove = product.stock - 1

      const res = await request(app)
        .delete(`/cart/${product._id.toString()}?amount=${amountToRemove}`)

      expect(res).to.have.status(200)
      expect(res.body.items[0].productId).to.equal(product._id.toString())
      expect(res.body.items[0].amount).to.equal(product.stock - amountToRemove)

      const expected = await Product.findById(product._id)
      expect(expected.tempStock).to.equal(amountToRemove)
    })

    it('Should remove item from cart if completely removed', async () => {
      const product = insertedProducts[0]
      const amountToRemove = product.stock

      const res = await request(app)
        .delete(`/cart/${product._id.toString()}?amount=${amountToRemove}`)

      expect(res).to.have.status(200)
      expect(res.body.items.length).to.equal(0)

      const expected = await Product.findById(product._id)
      expect(expected.tempStock).to.equal(amountToRemove)
    })
  })

  describe('DELETE /', () => {
    beforeEach(async () => {
      await Product.deleteMany()
      const insertedProducts = await Product.insertMany(products)

      const promises = insertedProducts.map((product) => {
        const amountInCart = product.stock
        return request(app).put(`/cart/${product._id.toString()}?amount=${amountInCart}`)
      })

      await Promise.all(promises)
    })

    it('Should empty cart form all items and restock them', async () => {
      const res = await request(app).delete('/cart')

      expect(res).to.have.status(200)
      expect(res.body.items.length).to.equal(0)

      const products = await Product.find({})
      products.forEach((product) => {
        expect(product.tempStock).to.equal(product.stock)
      })
    })
  })
})