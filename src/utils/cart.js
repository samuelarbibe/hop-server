const { ObjectId } = require('mongodb')
const createHttpError = require('http-errors')

const Cart = require('../models/Cart')
const Product = require('../models/Product')
const ShippingMethod = require('../models/ShippingMethod')
const Order = require('../models/Order')

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
    throw createHttpError(404, `No item of product ${productId} in cart ${cartId.toString()}`)
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

  const updatedCart = await Cart.findByIdAndUpdate(cartId, { $set: { items: updatedItems } })
  if (!updatedCart) {
    throw createHttpError(500, `Could not remove item ${productId} from cart ${productId}`)
  }

  await Product.findByIdAndUpdate(productId, { $inc: { tempStock: amount } })
  return updatedCart
}

const emptyCart = async (cartId) => {
  const cart = await Cart.findById(cartId)
  if (!cart) {
    throw createHttpError(404, `No Cart with ID: ${cartId}`)
  }

  const removePromises = cart.items.map(async (item) => {
    return removeItem(cartId, item.productId, item.amount)
  })

  await Promise.all(removePromises)
  const updatedCart = await clearShippingMethod(cartId)

  if (updatedCart.orderId) {
    await Order.findByIdAndUpdate(updatedCart.orderId, { status: 'cancelled' })
  }

  await Cart.findByIdAndDelete(cartId)

  return updatedCart
}

const approveCart = async (cartId) => {
  let orderId
  try {
    const cart = await Cart.findById(cartId)
    orderId = cart.orderId
    const removePromises = cart.items.map(async (item) => {
      const update = {
        $inc: { stock: -item.amount }
      }
      await Product.findByIdAndUpdate(item.productId, update)
    })

    await Promise.all(removePromises)
    await ShippingMethod.findByIdAndUpdate(cart.shippingMethod, { $inc: { stock: -1 } })

    return await Cart.findByIdAndDelete(cartId)
  } catch (error) {
    throw Error(`FATAL: Failed to update order status (${orderId ? `order ${orderId}` : `cart ${cartId}`}): ${error.message}`)
  }
}

const setShippingMethod = async (cartId, shippingMethodId) => {
  const cart = await Cart.findById(cartId)
  if (!cart) {
    throw createHttpError(404, `No Cart with ID: ${cartId}`)
  }

  const shippingMethod = await ShippingMethod.findById(shippingMethodId)
  if (!shippingMethod) {
    throw createHttpError(404, `No Shipping method with ID: ${shippingMethodId}`)
  }

  if (shippingMethod.tempStock === 0) {
    throw createHttpError(409, `Not enough in stock: ${shippingMethodId}`)
  }

  const prevShippingMethod = cart.shippingMethod && await ShippingMethod.findById(cart.shippingMethod)
  if (prevShippingMethod) {
    await ShippingMethod.findByIdAndUpdate(prevShippingMethod._id, { $inc: { tempStock: 1 } })
  }

  const query = {
    _id: ObjectId(shippingMethodId),
    tempStock: { $gt: 0 }
  }
  const update = { $inc: { tempStock: -1 } }
  const updatedShippingMethod = await ShippingMethod.findOneAndUpdate(query, update)
  if (!updatedShippingMethod) {
    throw createHttpError(500, `Could not set shipping method ${shippingMethodId} on cart ${cartId}`)
  }

  const updatedCart = await Cart.findByIdAndUpdate(cartId, { $set: { shippingMethod: shippingMethodId } })
  return updatedCart
}

const clearShippingMethod = async (cartId) => {
  const cart = await Cart.findById(cartId)
  if (!cart) {
    throw createHttpError(404, `No Cart with ID: ${cartId}`)
  }
  const shippingMethodId = cart.shippingMethod

  if (!shippingMethodId) {
    return cart
  }

  const shippingMethod = await ShippingMethod.findById(shippingMethodId)
  if (!shippingMethod) {
    throw createHttpError(404, `No Shipping method with ID: ${shippingMethodId}`)
  }

  const updatedCart = await Cart.findByIdAndUpdate(cartId, { $unset: { shippingMethod: null } })
  if (!updatedCart) {
    throw createHttpError(500, `Could not set shipping method ${shippingMethodId} on cart ${cartId}`)
  }

  await ShippingMethod.findByIdAndUpdate(shippingMethodId, { $inc: { tempStock: 1 } })
  return updatedCart
}

const setCustomerAddress = async (cartId, { address, houseNumber }) => {
  const findQuery = { _id: cartId }
  const updateQuery = {
    $set: {
      'customerDetails.address': address,
      'customerDetails.houseNumber': houseNumber
    }
  }
  const updatedCart = await Cart.findOneAndUpdate(findQuery, updateQuery, { runValidators: true })
  return updatedCart
}

const setCustomerDetails = async (cartId, { fullName, email, phoneNumber }) => {
  const findQuery = { _id: cartId }

  const updateQuery = {
    $set: {
      'customerDetails.fullName': fullName,
      'customerDetails.email': email,
      'customerDetails.phoneNumber': phoneNumber,
    }
  }
  const updatedCart = await Cart.findOneAndUpdate(findQuery, updateQuery, { runValidators: true })
  return updatedCart
}

const getCartForOrder = async (cart, orderId) => {
  const { items, shippingMethod: shippingMethodId } = cart
  const products = await Product.find({ _id: { $in: items.map(({ productId }) => ObjectId(productId)) } })
  const shippingMethod = await ShippingMethod.findById(shippingMethodId).lean()

  if (!products?.length || !shippingMethod) {
    throw createHttpError(400, 'Could not create order items, invalid cart')
  }

  const cartForOrder = {
    ...cart,
    items: products.map((product) => {
      const amount = items.find((item) => item.productId === product._id.toString()).amount
      return {
        productId: product._id.toString(),
        productName: product.name,
        productDescription: product.description,
        productPrice: product.price,
        amount,
      }
    }),
    shippingMethod: {
      ...shippingMethod,
      _id: shippingMethod._id.toString()
    },
    orderId: orderId.toString()
  }

  return cartForOrder
}

module.exports = {
  addItem,
  removeItem,
  emptyCart,
  approveCart,
  getCartForOrder,
  setShippingMethod,
  setCustomerDetails,
  setCustomerAddress,
  clearShippingMethod,
}