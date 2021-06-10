const express = require('express')
const createHttpError = require('http-errors')

const logger = require('../utils/logger')

const Cart = require('../models/Cart')

const getCart = async (req, res, next) => {
  try {
    const fingerprint = req.fingerprint.hash
    const cart = await Cart.findById(fingerprint)
    res.json(cart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load cart'))
  }
}

const addProduct = async (req, res, next) => {
  try {
    const fingerprint = req.fingerprint.hash
    const productId = req.params.id
    const amount = Number(req.query.amount || 1)

    const updatedCart = await Cart.addItem(fingerprint, productId, amount)
    res.json(updatedCart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not add item'))
  }
}

const removeProduct = async (req, res, next) => {
  try {
    const fingerprint = req.fingerprint.hash
    const productId = req.params.id
    const amount = Number(req.query.amount || 1)

    const updatedCart = await Cart.removeItem(fingerprint, productId, amount)
    res.json(updatedCart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not remove item'))
  }
}

const emptyCart = async (req, res, next) => {
  try {
    const fingerprint = req.fingerprint.hash

    const updatedCart = await Cart.empty(fingerprint)
    res.json(updatedCart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not empty cart'))
  }
}


const cartRoutes = express.Router()
cartRoutes.get('/', getCart)
cartRoutes.put('/:id', addProduct)
cartRoutes.delete('/:id', removeProduct)
cartRoutes.delete('/', emptyCart)

module.exports = cartRoutes