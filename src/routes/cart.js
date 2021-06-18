const express = require('express')
const createHttpError = require('http-errors')

const logger = require('../utils/logger')

const Cart = require('../models/Cart')
const { addItem, removeItem, emptyCart, setShippingMethod, clearShippingMethod } = require('../utils/cart')

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
cartRoutes.put('/product/:id', addProductHandler)
cartRoutes.delete('/product/:id', removeProductHandler)
cartRoutes.put('/shippingMethod/:id', setShippingMethodHandler)
cartRoutes.delete('/shippingMethod', clearShippingMethodHandler)
cartRoutes.delete('/', emptyCartHandler)

module.exports = cartRoutes