const express = require('express')
const createHttpError = require('http-errors')
const { isAuth } = require('../middlewares/authMiddleware')
const Product = require('../models/Product')
const logger = require('../utils/logger')

const getAvailableProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ stock: { $gt: 0 } })
    res.json(products)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load products'))
  }
}

const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find({})
    res.json(products)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load products'))
  }
}

const updateProduct = async (req, res, next) => {
  try {
    const { _id, ...productToUpdate } = req.body
    const updatedProduct = await Product.findByIdAndUpdate(_id, productToUpdate)
    if (!updatedProduct) {
      next(createHttpError(404, `No Product with ID: ${_id}`))
    }

    res.json(updatedProduct)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not update product'))
  }
}

const addProduct = async (req, res, next) => {
  try {
    const newProduct = await Product.create(req.body)
    res.status(201).json(newProduct)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not add product'))
  }
}

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params
    const deletedProduct = await Product.findByIdAndDelete(id)
    if (!deletedProduct) {
      next(createHttpError(404, `No Product with ID: ${id}`))
    }

    res.json(deletedProduct)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not add product'))
  }
}

const getProductById = async (req, res, next) => {
  try {
    const id = req.params.id
    const product = await Product.findById(id)
    if (!product) {
      next(createHttpError(404, `No Product with ID: ${id}`))
    }

    res.json(product)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load products'))
  }
}

const productRoutes = express.Router()

productRoutes.get('/all', isAuth, getAllProducts)
productRoutes.get('/:id', getProductById)
productRoutes.post('/', isAuth, addProduct)
productRoutes.get('/', getAvailableProducts)
productRoutes.put('/', isAuth, updateProduct)
productRoutes.delete('/:id', isAuth, deleteProduct)

module.exports = productRoutes