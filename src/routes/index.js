const express = require('express')
const queue = require('express-queue');

const cartRoutes = require('./cart')
const productsRoutes = require('./products');
const shippingMethodRoutes = require('./shippingMethods');

const routes = express.Router()
routes.use('/products', productsRoutes)
routes.use('/shippingMethods', shippingMethodRoutes)
routes.use('/cart', queue({ activeLimit: 1, queuedLimit: -1 }), cartRoutes)

module.exports = routes