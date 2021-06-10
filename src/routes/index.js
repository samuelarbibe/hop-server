const express = require('express')

const cartRoutes = require('./cart')
const productsRoutes = require('./products')

const routes = express.Router()
routes.use('/cart', cartRoutes)
routes.use('/products', productsRoutes)

module.exports = routes