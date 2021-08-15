const moment = require('moment')
const express = require('express')
const { ObjectId } = require('mongodb')
const createHttpError = require('http-errors')
const logger = require('../utils/logger')

const Cart = require('../models/Cart')
const Order = require('../models/Order')

const { sendMail } = require('../utils/mail')
const { approveCart, getCartForOrder } = require('../utils/cart')
const { approveTransaction, createPaymentProcess, approveOrder } = require('../utils/orders')

const EXTRA_ORDER_MINUTES = 16

const createOrder = async (req, res, next) => {
  try {
    const cartId = req.fingerprint.hash
    const cart = await Cart.findById(cartId).lean()

    if (cart.orderId) {
      const order = await Order.findById(cart.orderId)
      return res.send({ url: order.paymentProcess.url })
    }

    const orderId = new ObjectId()
    const cartForOrder = await getCartForOrder(cart, orderId)
    const paymentProcess = await createPaymentProcess(cartForOrder)

    const updatedExpiresAt = moment().add(EXTRA_ORDER_MINUTES, 'minutes').toDate()
    await Cart.findByIdAndUpdate(cartId, {
      $set: {
        expiresAt: updatedExpiresAt,
        orderId: orderId.toString()
      }
    })

    await Order.create({
      _id: orderId,
      cart: cartForOrder,
      paymentProcess,
      status: 'pending',
    })

    res.send({ url: paymentProcess.url })
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not get order'))
  }
}

const cancelOrder = async (req, res, next) => {
  try {
    const cartId = req.fingerprint.hash
    const cart = await Cart.findById(cartId)

    if (!cart) {
      throw createHttpError(404, 'Cart not found')
    }

    const order = await Order.findByIdAndUpdate(cart.orderId, { $set: { status: 'cancelled' } })
    if (!order) {
      throw createHttpError(404, `Order for cart ${cartId} not found`)
    }

    const updatedExpiresAt = moment(cart.expiresAt).subtract(EXTRA_ORDER_MINUTES, 'minutes').toDate()
    const updatedCart = await Cart.findByIdAndUpdate(cartId, { $set: { expiresAt: updatedExpiresAt } })

    res.send(updatedCart)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not cancel order'))
  }
}

const updateOrderStatus = async (req, res, next) => {
  try {
    const { data: transactionDetails } = req.body
    Object.keys(transactionDetails).forEach((key) => {
      logger.info(key + ': ' + transactionDetails[key])
    })

    const { cField1: orderId, cField2: cartId } = transactionDetails.customFields

    await approveTransaction(transactionDetails)
    await approveOrder(orderId, transactionDetails)
    await approveCart(cartId)

    await sendMail(orderId)

    res.send()
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, `Could not update transaction status ${error.message}`))
  }
}

const ordersRoutes = express.Router()

ordersRoutes.get('/createOrder', createOrder)
ordersRoutes.delete('/cancelOrder', cancelOrder)
ordersRoutes.post('/updateStatus', updateOrderStatus)

module.exports = ordersRoutes