const express = require('express')
const createHttpError = require('http-errors')

const logger = require('../utils/logger')

const Cart = require('../models/Cart')
const {
  addItem,
  removeItem,
  emptyCart,
  setShippingMethod,
  clearShippingMethod,
  setCustomerAddress,
  setCustomerDetails,
} = require('../utils/cart')
const { isAuth } = require('../middlewares/authMiddleware')

const getCartHandler = async (req, res, next) => {
  try {
    const cartId = req.fingerprint.hash
    const cart = await Cart.findById(cartId)
    res.json(cart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load cart'))
  }
}

const getAllCartsHandler = async (req, res, next) => {
  try {
    const cartId = req.fingerprint.hash
    const carts = await Cart.find({ _id: { $ne: cartId } })
    res.json(carts)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load carts'))
  }
}

const addProductHandler = async (req, res, next) => {
  try {
    const cartId = req.fingerprint.hash
    const productId = req.params.id
    const amount = Number(req.query.amount || 1)

    const updatedCart = await addItem(cartId, productId, amount)
    res.json(updatedCart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not add item'))
  }
}

const removeProductHandler = async (req, res, next) => {
  try {
    const cartId = req.fingerprint.hash
    const productId = req.params.id
    const amount = Number(req.query.amount || 1)

    const updatedCart = await removeItem(cartId, productId, amount)
    res.json(updatedCart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not remove item'))
  }
}

const setShippingMethodHandler = async (req, res, next) => {
  try {
    const cartId = req.fingerprint.hash
    const shippingMethodId = req.params.id

    const updatedCart = await setShippingMethod(cartId, shippingMethodId)
    res.json(updatedCart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not set shipping method'))
  }
}

const clearShippingMethodHandler = async (req, res, next) => {
  try {
    const cartId = req.fingerprint.hash

    const updatedCart = await clearShippingMethod(cartId)
    res.json(updatedCart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not clear shipping method'))
  }
}

const setCustomerAddressHandler = async (req, res, next) => {
  try {
    const cartId = req.fingerprint.hash
    const address = req.body.address
    const houseNumber = +req.body.houseNumber

    const updatedCart = await setCustomerAddress(cartId, { address, houseNumber })
    res.json(updatedCart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not set customer address'))
  }
}

const setCustomerDetailsHandler = async (req, res, next) => {
  try {
    const cartId = req.fingerprint.hash
    const fullName = req.body.fullName
    const email = req.body.email
    const phoneNumber = req.body.phoneNumber

    const updatedCart = await setCustomerDetails(cartId, { fullName, email, phoneNumber })
    res.json(updatedCart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not set customer address'))
  }
}

const emptyCartHandler = async (req, res, next) => {
  try {
    const cartId = req.fingerprint.hash
    const updatedCart = await emptyCart(cartId)
    res.json(updatedCart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not empty cart'))
  }
}

const cartRoutes = express.Router()

cartRoutes.get('/', getCartHandler)
cartRoutes.get('/all', isAuth, getAllCartsHandler)
cartRoutes.delete('/', emptyCartHandler)

cartRoutes.put('/product/:id', addProductHandler)
cartRoutes.delete('/product/:id', removeProductHandler)

cartRoutes.put('/shippingMethod/:id', setShippingMethodHandler)
cartRoutes.delete('/shippingMethod', clearShippingMethodHandler)

cartRoutes.put('/address', setCustomerAddressHandler)
cartRoutes.put('/customerDetails', setCustomerDetailsHandler)

module.exports = cartRoutes