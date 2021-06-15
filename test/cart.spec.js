const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const { request, expect } = chai

const Cart = require('../src/models/Cart')
const Product = require('../src/models/Product')
const { createServer } = require('../src/server')
const app = createServer(true)

const products = require('./testData/products')

describe('Cart', () => {
  describe('GET /', () => {
    it('Should return cart', (done) => {
      request(app)
        .get('/api/cart')
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
        .put(`/api/cart/${product._id.toString()}?amount=${amount}`)
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
        .put(`/api/cart/${product._id.toString()}?amount=${amount}`)
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
      await request(app).put(`/api/cart/${productInCart._id.toString()}?amount=${amountInCart}`)
    })

    it('Should remove item from cart and restock', async () => {
      const product = insertedProducts[0]
      const amountToRemove = product.stock - 1

      const res = await request(app)
        .delete(`/api/cart/${product._id.toString()}?amount=${amountToRemove}`)

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
        .delete(`/api/cart/${product._id.toString()}?amount=${amountToRemove}`)

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
        return request(app).put(`/api/cart/${product._id.toString()}?amount=${amountInCart}`)
      })

      await Promise.all(promises)
    })

    it('Should empty cart form all items and restock them', async () => {
      const res = await request(app).delete('/api/cart')

      expect(res).to.have.status(200)
      expect(res.body.items.length).to.equal(0)

      const products = await Product.find({})
      products.forEach((product) => {
        expect(product.tempStock).to.equal(product.stock)
      })
    })
  })

  describe('Stress test', () => {
    let insertedProduct
    beforeEach(async () => {
      await Product.deleteMany()
      await Cart.deleteMany()
      const productToInsert = { ...products[0], tempStock: 1000 }
      insertedProduct = await Product.create(productToInsert)
    })

    it('Use up all stock', async () => {
      const requestPromises = []

      for (let i = 0; i < 100; i++) {
        const amount = Math.round(Math.random() * 10)
        const fakeFingerprint = `mock-fingerprint-${i}`
        await request(app).get('/api/cart').send({ cartId: fakeFingerprint })

        requestPromises.push(
          request(app)
            .put(`/api/cart/${insertedProduct._id.toString()}?amount=${amount}`)
            .send({ cartId: fakeFingerprint })
        )
      }

      await Promise.allSettled(requestPromises)

      const product = await Product.findById(insertedProduct._id)
      const productAmountInCarts = await Cart.find({}).then((carts) => carts.reduce((acc, curr) => {
        return curr.items.length ? acc + curr.items[0].amount : acc
      }, 0))
      expect(product.tempStock).to.equal(insertedProduct.tempStock - productAmountInCarts)
    })

    it('Use and delete all stock', async () => {
      const requestPromises = []

      for (let i = 0; i < 100; i++) {
        const amount = Math.round(Math.random() * 10)
        const fakeFingerprint = `mock-fingerprint-${i}`
        await request(app).get('/api/cart').send({ cartId: fakeFingerprint })

        requestPromises.push(
          request(app)
            .put(`/api/cart/${insertedProduct._id.toString()}?amount=${amount}`)
            .send({ cartId: fakeFingerprint })
            .then(() => request(app)
              .delete(`/api/cart/${insertedProduct._id.toString()}?amount=${amount}`)
              .send({ cartId: fakeFingerprint }))
        )
      }

      await Promise.allSettled(requestPromises)

      const product = await Product.findById(insertedProduct._id)
      expect(product.tempStock).to.equal(insertedProduct.tempStock)
    })

    it('Try to use more stock then available', async () => {
      const requestPromises = []

      for (let i = 0; i < 100; i++) {
        const amount = Math.round(Math.random() * 10)
        const fakeFingerprint = `mock-fingerprint-${i}`
        await request(app).get('/api/cart').send({ cartId: fakeFingerprint })

        requestPromises.push(request(app).put(`/api/cart/${insertedProduct._id.toString()}?amount=${amount}`).send({ cartId: fakeFingerprint }))
      }

      await Promise.allSettled(requestPromises)

      const product = await Product.findById(insertedProduct._id)
      const productAmountInCarts = await Cart.find({}).then((carts) => carts.reduce((acc, curr) => {
        return curr.items.length ? acc + curr.items[0].amount : acc
      }, 0))
      expect(product.tempStock).to.equal(insertedProduct.tempStock - productAmountInCarts)
    })

    it('Try to delete and use more stock then available', async () => {
      const requestPromises = []

      for (let i = 0; i < 100; i++) {
        const amount = Math.round(Math.random() * 10)
        const fakeFingerprint = `mock-fingerprint-${i}`
        await request(app).get('/api/cart').send({ cartId: fakeFingerprint })

        requestPromises.push(
          request(app)
            .put(`/api/cart/${insertedProduct._id.toString()}?amount=${amount}`)
            .send({ cartId: fakeFingerprint })
        )
        requestPromises.push(
          request(app)
            .delete(`/api/cart/${insertedProduct._id.toString()}?amount=${amount}`)
            .send({ cartId: fakeFingerprint })
        )
      }

      await Promise.all(requestPromises)

      const product = await Product.findById(insertedProduct._id)
      const productAmountInCarts = await Cart.find({}).then((carts) => carts.reduce((acc, curr) => {
        return curr.items.length ? acc + curr.items[0].amount : acc
      }, 0))
      expect(product.tempStock).to.equal(insertedProduct.tempStock - productAmountInCarts)
    })
  })
})