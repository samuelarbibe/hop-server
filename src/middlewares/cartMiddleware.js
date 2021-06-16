const createHttpError = require('http-errors')
const logger = require('../utils/logger')

const Cart = require('../models/Cart')

const cartMiddleware = async (req, res, next) => {
  try {
    req.fingerprint.hash = req.body.cartId || req.fingerprint.hash
    const fingerprint = req.fingerprint.hash
    const cart = await Cart.findById(fingerprint)

    if (!cart) {
      await Cart.updateOne({ _id: fingerprint }, { _id: fingerprint, items: [], createdAt: new Date() }, { upsert: 1 })
    }
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not create cart'))
  }

  next()
}

module.exports = cartMiddleware