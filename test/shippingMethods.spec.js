const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const { request, expect } = chai

const ShippingMethod = require('../src/models/ShippingMethod')
const { createServer } = require('../src/server')
const app = createServer(true)

const shippingMethods = require('./testData/shippingMethods')

describe('Shipping Methods', () => {
  describe('GET /', () => {
    before(async () => {
      await ShippingMethod.insertMany(shippingMethods)
    })

    it('Should return all shipping methods', (done) => {
      request(app)
        .get('/api/shippingMethods')
        .end((err, res) => {
          expect(err).to.be.null
          expect(res).to.have.status(200)
          expect(res.body.length).to.equal(shippingMethods.length)
          done()
        })
    })
  })

  describe('POST /', () => {
    it('Should add product', async () => {
      const shippingMethodToAdd = shippingMethods[0]
      const res = await request(app)
        .post('/api/shippingMethods')
        .send(shippingMethodToAdd)

      expect(res).to.have.status(201)

      const docs = await ShippingMethod.find({})
      const expected = JSON.parse(JSON.stringify(docs))
      expect(expected).to.include.deep.members([res.body])
    })
  })
})