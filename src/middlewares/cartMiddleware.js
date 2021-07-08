const createHttpError = require('http-errors')
const logger = require('../utils/logger')

const Cart = require('../models/Cart')
const Const = require('../models/Const')

const cartMiddleware = async (req, res, next) => {
  try {
    req.fingerprint.hash = req.body.cartId || req.fingerprint.hash
    const fingerprint = req.fingerprint.hash
    const cart = await Cart.findById(fingerprint)

    if (!cart) {
      const { value: timeToExpire } = await Const.findById('cart_time_to_expire')
      if (!timeToExpire) {
        throw Error('Error! missing cart_time_to_expire const.')
      }

      const query = { _id: fingerprint }
      const currentDate = new Date()
      const cartToInsert = {
        _id: fingerprint,
        items: [],
        createdAt: currentDate,
        expiresAt: new Date(currentDate.getTime() + 1000 * 60 * timeToExpire)
      }

      const options = { upsert: 1 }
      await Cart.updateOne(query, cartToInsert, options)
    }
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not create cart'))
  }

  next()
}

module.exports = cartMiddleware