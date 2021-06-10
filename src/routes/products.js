const express = require('express')
const createHttpError = require('http-errors')
const Product = require('../models/Product')
const logger = require('../utils/logger')

const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.find({})
    res.json(products)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load products'))
  }
}

const getProductById = async (req, res, next) => {
  try {
    const id = req.params.id
    const product = await Product.findById(id)
    if (!product) {
      res.next(createHttpError(404, `No Product with ID: ${id}`))
    }

    res.json(product)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load products'))
  }
}

const addProduct = async (req, res, next) => {
  try {
    const productData = req.body
    const productToAdd = new Product(productData)
    const newProduct = await productToAdd.save()
    res.status(201).json(newProduct)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not save product'))
  }
}

const getProductsAsCsv = async (req, res, next) => {
  try {
    const query = req.body || {}
    res.setHeader("content-type", "text/csv")
    res.setHeader("Content-Disposition", "attachmentfilename=products.csv")

    Product.findAndStreamCsv(query).pipe(res)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not get products as csv'))
  }
}

const addProductsFromCsv = async (req, res, next) => {
  try {
    if (!req.files.products) next(createHttpError(400, 'No File sent'))

    const csvData = req.files.products.data.toString('utf8')
    const insertedProducts = await Product.insertManyFromCsv(csvData)
    res.send(insertedProducts)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Failed to save products from csv'))
  }
}

const productRoutes = express.Router()
productRoutes.get('/', getAllProducts)
productRoutes.get('/:id', getProductById)
productRoutes.post('/', addProduct)
productRoutes.get('/csv', getProductsAsCsv)
productRoutes.post('/csv', addProductsFromCsv)

module.exports = productRoutes