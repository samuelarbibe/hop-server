const createHttpError = require("http-errors")
const logger = require("../utils/logger")

const Cart = require("../models/Cart")

const cartMiddleware = async (req, res, next) => {
  try {
    const fingerprint = req.fingerprint.hash
    const cart = await Cart.findById(fingerprint)

    if (!cart) {
      const newCart = new Cart({ _id: fingerprint, items: [] })
      await newCart.save()
    }
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not create cart'))
  }

  next()
}

module.exports = cartMiddleware