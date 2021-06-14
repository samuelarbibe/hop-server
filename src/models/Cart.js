const { ObjectId } = require('mongodb')
const createHttpError = require('http-errors')
const mongoose = require('mongoose')
const Product = require('./Product')
const { Schema } = mongoose

const addItem = async (cartId, productId, amount) => {
  const cart = await Cart.findById(cartId)
  if (!cart) {
    throw createHttpError(404, `No Cart with ID: ${cartId}`)
  }

  const product = await Product.findById(productId)
  if (!product) {
    throw createHttpError(404, `No Product with ID: ${productId}`)
  }

  if (product.tempStock < amount) {
    throw createHttpError(409, `Not enough in stock: ${productId}, ${amount}/${product.tempStock}`)
  }

  let itemExistsInCart = false
  const updatedItems = cart.items.map((item) => {
    if (item.productId === productId) {
      itemExistsInCart = true
      const updatedAmount = item.amount + amount
      return { productId, amount: updatedAmount }
    }
    return item
  })

  if (!itemExistsInCart) {
    updatedItems.push({
      productId,
      amount,
    })
  }

  const updatedProduct = await Product.findOneAndUpdate({ _id: ObjectId(productId), tempStock: { $gte: amount } }, { $inc: { tempStock: -amount } })
  if (!updatedProduct) {
    throw createHttpError(409, `Could not add item to cart: ${productId}`)
  }

  const updatedCart = await Cart.findByIdAndUpdate(cartId, { $set: { items: updatedItems } })

  return updatedCart
}

const removeItem = async (cartId, productId, amount) => {
  const cart = await Cart.findById(cartId)
  if (!cart) {
    throw createHttpError(404, `No Cart with ID: ${cartId}`)
  }

  const product = await Product.findById(productId)
  if (!product) {
    throw createHttpError(404, `No Product with ID: ${productId}`)
  }

  if (!cart.items.find((item) => item.productId === productId)) {
    throw createHttpError(404, `No item of product ${productId} in cart ${cart._id.toString()}`)
  }

  let updatedItems = cart.items.filter((item) => item.productId === productId ? item.amount > amount : true)

  if (updatedItems.length === cart.items.length) {
    updatedItems = cart.items.map((item) => {
      if (item.productId === productId) {
        const updatedAmount = item.amount - amount
        return { productId, amount: updatedAmount }
      }
      return item
    })
  }

  const updatedProduct = await Product.findOneAndUpdate({ _id: ObjectId(productId) }, { $inc: { tempStock: amount } })
  if (!updatedProduct) {
    throw createHttpError(500, `Could not remove item from cart: ${productId}`)
  }

  const updatedCart = await Cart.findByIdAndUpdate(cart._id, { $set: { items: updatedItems } })

  return updatedCart
}

const emptyCart = async (cartId) => {
  const cart = await Cart.findById(cartId)
  if (!cart) {
    throw createHttpError(404, `No Cart with ID: ${cartId}`)
  }

  const removePromises = cart.items.map(async (item) => {
    return removeItem(cartId, item.productId.toString(), item.amount)
  })

  const updatedCarts = await Promise.all(removePromises)
  const lastUpdatedCart = updatedCarts[updatedCarts.length - 1]

  await Cart.findByIdAndDelete(cartId)

  return lastUpdatedCart
}

const cartSchema = new Schema({
  _id: String,
  items: [{
    _id: false,
    productId: String,
    amount: Number,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

cartSchema.static('addItem', addItem)
cartSchema.static('removeItem', removeItem)
cartSchema.static('empty', emptyCart)

const Cart = mongoose.model('cart', cartSchema)

module.exports = Cart