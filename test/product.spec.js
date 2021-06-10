const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const { request, expect } = chai

const Product = require('../src/models/Product')
const { createServer } = require('../src/server')
const app = createServer(true)

const products = require('./testData/products')

describe('Products', () => {
  describe('GET /', () => {
    before(async () => {
      await Product.insertMany(products)
    })

    it('Should return all products', (done) => {
      request(app)
        .get('/api/products')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body.length).to.equal(products.length)
          done()
        })
    })
  })

  describe('POST /', () => {
    it('Should add product', async () => {
      const productToAdd = products[0]
      const res = await request(app)
        .post('/api/products')
        .send(productToAdd)

      expect(res).to.have.status(201)

      const docs = await Product.find({})
      const expected = JSON.parse(JSON.stringify(docs))[0]
      expect(res.body).to.deep.equal(expected)
    })
  })
})