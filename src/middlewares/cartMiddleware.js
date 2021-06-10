const Cart = require("../models/Cart")
// const logger = require("../utils/logger")

const cartMiddleware = async (req, res, next) => {
  const fingerprint = req.fingerprint.hash
  const cart = await Cart.findById(fingerprint)

  if (!cart) {
    // logger.debug(`Creating new cart for user ${fingerprint}`)
    const newCart = new Cart({ _id: fingerprint, items: [] })
    await newCart.save()
  }

  next()
}

module.exports = cartMiddleware