const express = require('express')
const createHttpError = require('http-errors')
const { isAuth } = require('../middlewares/authMiddleware')
const ShippingMethod = require('../models/ShippingMethod')
const logger = require('../utils/logger')

const getAvailableShippingMethods = async (req, res, next) => {
  try {
    const shippingMethods = await ShippingMethod.find({ tempStock: { $gt: 0 } })
    res.json(shippingMethods)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load shipping methods'))
  }
}

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
      next(createHttpError(404, `No Shipping method with ID: ${id}`))
    }

    res.json(shippingMethod)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load shipping methods'))
  }
}

const updateShippingMethod = async (req, res, next) => {
  try {
    const { _id, ...shippingMethodToUpdate } = req.body
    const updatedShippingMethod = await ShippingMethod.findByIdAndUpdate(_id, shippingMethodToUpdate)
    if (!updatedShippingMethod) {
      next(createHttpError(404, `No Shipping method with ID: ${_id}`))
    }

    res.json(updatedShippingMethod)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not update shipping method'))
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

const deleteShippingMethod = async (req, res, next) => {
  try {
    const { id } = req.params
    const deletedShippingMethod = await ShippingMethod.findByIdAndDelete(id)
    if (!deletedShippingMethod) {
      next(createHttpError(404, `No shipping method with ID: ${id}`))
    }

    res.json(deletedShippingMethod)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not add product'))
  }
}

const shippingMethodRoutes = express.Router()
shippingMethodRoutes.post('/', isAuth, addShippingMethod)
shippingMethodRoutes.put('/', isAuth, updateShippingMethod)
shippingMethodRoutes.get('/all', isAuth, getAllShippingMethods)
shippingMethodRoutes.delete('/:id', isAuth, deleteShippingMethod)

shippingMethodRoutes.get('/:id', getShippingMethodById)
shippingMethodRoutes.get('/', getAvailableShippingMethods)

module.exports = shippingMethodRoutes