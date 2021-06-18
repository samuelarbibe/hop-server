const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const { request, expect } = chai

const Cart = require('../src/models/Cart')
const Product = require('../src/models/Product')
const ShippingMethod = require('../src/models/ShippingMethod')
const { createServer } = require('../src/server')
const app = createServer(true)

const products = require('./testData/products')
const shippingMethods = require('./testData/shippingMethods')

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

  describe('PUT /product/:id', () => {
    let insertedProducts

    beforeEach(async () => {
      await Product.deleteMany()
      insertedProducts = await Product.insertMany(products)
    })

    it('Should add new item for product', async () => {
      const product = insertedProducts[0]
      const amount = product.stock - 1

      const res = await request(app)
        .put(`/api/cart/product/${product._id.toString()}?amount=${amount}`)
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
        .put(`/api/cart/product/${product._id.toString()}?amount=${amount}`)
      expect(res).to.have.status(409)

      const addedProduct = await Product.findById(product._id)
      expect(addedProduct.tempStock).to.equal(addedProduct.stock)
    })
  })

  describe('DELETE /product/:id', () => {
    let insertedProducts

    beforeEach(async () => {
      await Product.deleteMany()
      insertedProducts = await Product.insertMany(products)

      const productInCart = insertedProducts[0]
      const amountInCart = productInCart.stock
      await request(app).put(`/api/cart/product/${productInCart._id.toString()}?amount=${amountInCart}`)
    })

    it('Should remove item from cart and restock', async () => {
      const product = insertedProducts[0]
      const amountToRemove = product.stock - 1

      const res = await request(app)
        .delete(`/api/cart/product/${product._id.toString()}?amount=${amountToRemove}`)

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
        .delete(`/api/cart/product/${product._id.toString()}?amount=${amountToRemove}`)

      expect(res).to.have.status(200)
      expect(res.body.items.length).to.equal(0)

      const expected = await Product.findById(product._id)
      expect(expected.tempStock).to.equal(amountToRemove)
    })
  })

  describe('PUT /shippingMethod/:id', () => {
    let insertedShippingMethods

    beforeEach(async () => {
      await ShippingMethod.deleteMany()
      insertedShippingMethods = await ShippingMethod.insertMany(shippingMethods)
    })

    it('Should set shipping method', async () => {
      const shippingMethod = insertedShippingMethods[0]

      const res = await request(app)
        .put(`/api/cart/shippingMethod/${shippingMethod._id.toString()}`)
      expect(res).to.have.status(200)
      expect(res.body.shippingMethod).to.equal(shippingMethod._id.toString())

      const doc = await ShippingMethod.findById(shippingMethod._id)
      expect(doc.tempStock).to.equal(shippingMethod.tempStock - 1)
    })

    it('Should return error if not enough in stock', async () => {
      const shippingMethod = insertedShippingMethods[0]
      await ShippingMethod.findByIdAndUpdate(shippingMethod._id, { tempStock: 0 })

      const res = await request(app)
        .put(`/api/cart/shippingMethod/${shippingMethod._id.toString()}`)
      expect(res).to.have.status(409)

      const addedShippingMethod = await ShippingMethod.findById(shippingMethod._id)
      expect(addedShippingMethod.tempStock).to.equal(0)
    })
  })

  describe('DELETE /shippingMethod/:id', () => {
    let insertedShippingMethods

    beforeEach(async () => {
      await ShippingMethod.deleteMany()
      insertedShippingMethods = await ShippingMethod.insertMany(shippingMethods)

      const shippingMethodInCart = insertedShippingMethods[0]
      await request(app).put(`/api/cart/shippingMethod/${shippingMethodInCart._id.toString()}`)
    })

    it('Should clear shipping and restock', async () => {
      const shippingMethod = insertedShippingMethods[0]

      const res = await request(app).delete('/api/cart/shippingMethod')

      expect(res).to.have.status(200)
      expect(res.body.shippingMethod).to.be.undefined

      const expected = await ShippingMethod.findById(shippingMethod._id)
      expect(expected.tempStock).to.equal(shippingMethod.tempStock)
    })
  })

  describe('DELETE /', () => {
    beforeEach(async () => {
      await Product.deleteMany()
      const insertedProducts = await Product.insertMany(products)

      const promises = insertedProducts.map((product) => {
        const amountInCart = product.stock
        return request(app).put(`/api/cart/product/${product._id.toString()}?amount=${amountInCart}`)
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
    context('Products => Cart', () => {
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
              .put(`/api/cart/product/${insertedProduct._id.toString()}?amount=${amount}`)
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
          await request(app).get('/api/cart/product').send({ cartId: fakeFingerprint })

          requestPromises.push(
            request(app)
              .put(`/api/cart/product/${insertedProduct._id.toString()}?amount=${amount}`)
              .send({ cartId: fakeFingerprint })
              .then(() => request(app)
                .delete(`/api/cart/product/${insertedProduct._id.toString()}?amount=${amount}`)
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

          requestPromises.push(request(app).put(`/api/cart/product/${insertedProduct._id.toString()}?amount=${amount}`).send({ cartId: fakeFingerprint }))
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
              .put(`/api/cart/product/${insertedProduct._id.toString()}?amount=${amount}`)
              .send({ cartId: fakeFingerprint })
          )
          requestPromises.push(
            request(app)
              .delete(`/api/cart/product/${insertedProduct._id.toString()}?amount=${amount}`)
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

    context('Shipping methods => Cart', () => {
      let insertedShippingMethod

      beforeEach(async () => {
        await ShippingMethod.deleteMany()
        await Cart.deleteMany()
        const shippingMethodToInsert = { ...shippingMethods[0], tempStock: 50 }
        insertedShippingMethod = await ShippingMethod.create(shippingMethodToInsert)
      })

      it('Use up all stock', async () => {
        const requestPromises = []

        for (let i = 0; i < 100; i++) {
          const fakeFingerprint = `mock-fingerprint-${i}`
          await request(app).get('/api/cart').send({ cartId: fakeFingerprint })

          requestPromises.push(
            request(app)
              .put(`/api/cart/shippingMethod/${insertedShippingMethod._id.toString()}`)
              .send({ cartId: fakeFingerprint })
          )
        }

        await Promise.allSettled(requestPromises)

        const shippingMethod = await ShippingMethod.findById(insertedShippingMethod._id)
        const shippingMethodsInCarts = await Cart.find({}).then((carts) => carts.reduce((acc, curr) => {
          return curr.shippingMethod ? acc + 1 : acc
        }, 0))
        expect(shippingMethod.tempStock).to.equal(insertedShippingMethod.tempStock - shippingMethodsInCarts)
      })

      it('Use and delete all stock', async () => {
        const requestPromises = []

        for (let i = 0; i < 100; i++) {
          const fakeFingerprint = `mock-fingerprint-${i}`
          await request(app).get('/api/cart/shippingMethod').send({ cartId: fakeFingerprint })

          requestPromises.push(
            request(app)
              .put(`/api/cart/shippingMethod/${insertedShippingMethod._id.toString()}`)
              .send({ cartId: fakeFingerprint })
              .then(() => request(app)
                .delete('/api/cart/shippingMethod')
                .send({ cartId: fakeFingerprint }))
          )
        }

        await Promise.allSettled(requestPromises)

        const shippingMethod = await ShippingMethod.findById(insertedShippingMethod._id)
        expect(shippingMethod.tempStock).to.equal(insertedShippingMethod.tempStock)
      })

      it('Try to use more stock then available', async () => {
        const requestPromises = []

        for (let i = 0; i < 100; i++) {
          const amount = Math.round(Math.random() * 10)
          const fakeFingerprint = `mock-fingerprint-${i}`
          await request(app).get('/api/cart').send({ cartId: fakeFingerprint })

          requestPromises.push(request(app).put(`/api/cart/shippingMethod/${insertedShippingMethod._id.toString()}?amount=${amount}`).send({ cartId: fakeFingerprint }))
        }

        await Promise.allSettled(requestPromises)

        const shippingMethod = await ShippingMethod.findById(insertedShippingMethod._id)
        const shippingMethodsInCarts = await Cart.find({}).then((carts) => carts.reduce((acc, curr) => {
          return curr.shippingMethod ? acc + 1 : acc
        }, 0))
        expect(shippingMethod.tempStock).to.equal(insertedShippingMethod.tempStock - shippingMethodsInCarts)
      })

      it('Try to delete and use more stock then available', async () => {
        const requestPromises = []

        for (let i = 0; i < 100; i++) {
          const amount = Math.round(Math.random() * 10)
          const fakeFingerprint = `mock-fingerprint-${i}`
          await request(app).get('/api/cart').send({ cartId: fakeFingerprint })

          requestPromises.push(
            request(app)
              .put(`/api/cart/shippingMethod/${insertedShippingMethod._id.toString()}?amount=${amount}`)
              .send({ cartId: fakeFingerprint })
          )
          requestPromises.push(
            request(app)
              .delete(`/api/cart/shippingMethod/${insertedShippingMethod._id.toString()}?amount=${amount}`)
              .send({ cartId: fakeFingerprint })
          )
        }

        await Promise.all(requestPromises)

        const shippingMethod = await ShippingMethod.findById(insertedShippingMethod._id)
        const shippingMethodsInCarts = await Cart.find({}).then((carts) => carts.reduce((acc, curr) => {
          return curr.shippingMethod ? acc + 1 : acc
        }, 0))
        expect(shippingMethod.tempStock).to.equal(insertedShippingMethod.tempStock - shippingMethodsInCarts)
      })
    })
  })
})