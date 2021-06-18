const express = require('express')
const createHttpError = require('http-errors')
const ShippingMethod = require('../models/ShippingMethod')
const logger = require('../utils/logger')

const getAllShippingMethods = async (req, res, next) => {
  try {
    const shippingMethods = await ShippingMethod.find({})
    res.json(shippingMethods)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load shipping methods'))
  }
}

const getShippingMethodById = async (req, res, next) => {
  try {
    const id = req.params.id
    const shippingMethod = await ShippingMethod.findById(id)
    if (!shippingMethod) {
      res.next(createHttpError(404, `No Shipping method with ID: ${id}`))
    }

    res.json(shippingMethod)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load shipping methods'))
  }
}

const addShippingMethod = async (req, res, next) => {
  try {
    const newShippingMethod = await ShippingMethod.create(req.body)

    res.status(201).json(newShippingMethod)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not save shipping method'))
  }
}

const shippingMethodRoutes = express.Router()
shippingMethodRoutes.get('/', getAllShippingMethods)
shippingMethodRoutes.get('/:id', getShippingMethodById)
shippingMethodRoutes.post('/', addShippingMethod)

module.exports = shippingMethodRoutes