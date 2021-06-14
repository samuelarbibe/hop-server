const createHttpError = require("http-errors")
const logger = require("../utils/logger")

const Cart = require("../models/Cart")

const cartMiddleware = async (req, res, next) => {
  try {
    const fingerprint = req.fingerprint.hash
    const cart = await Cart.findById(fingerprint)

    if (!cart) {
      await Cart.create({ _id: fingerprint, items: [] })
    }
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not create cart'))
  }

  next()
}

module.exports = cartMiddleware