const FormData = require('form-data')
const createHttpError = require('http-errors')

const Order = require('../models/Order')
const meshulamRequest = require('./meshulamRequest')

const createRequstDataFromCart = async (cart) => {
  const data = new FormData()
  data.append('pageCode', process.env.MESHULAM_API_PAGE_CODE)
  data.append('userId', process.env.MESHULAM_API_USER_ID)
  data.append('description', 'קניית פסטה')
  data.append('successUrl', process.env.MESHULAM_SUCCESS_URL)
  data.append('cancelUrl', process.env.MESHULAM_CANCEL_URL)
  data.append('pageField[fullName]', cart.customerDetails.fullName)
  data.append('pageField[phone]', cart.customerDetails.phoneNumber)
  data.append('pageField[email]', cart.customerDetails.email)
  data.append('cField1', cart.orderId)
  data.append('cField2', cart._id)
  data.append('saveCardToken', '1')
  data.append('chargeType', '1')

  if (cart.shippingMethod.type === 'delivery') {
    data.append('cField3', cart.customerDetails.address)
    data.append('cField4', cart.customerDetails.houseNumber)
  }

  let sum = cart.shippingMethod.price
  cart.items.forEach((item, index) => {
    sum += item.productPrice * item.amount
    data.append(`product_data[${index}][quantity]`, item.amount)
    data.append(`product_data[${index}][price]`, item.productPrice)
    data.append(`product_data[${index}][catalog_number]`, item.productId)
    data.append(`product_data[${index}][item_description]`, item.productName)
  })

  data.append('sum', sum)
  return data
}

const createPaymentProcess = async (cartForOrder) => {
  const requestData = await createRequstDataFromCart(cartForOrder)
  const requestUrl = `${process.env.MESHULAM_API_BASE_URL}/createPaymentProcess`

  const { status, data, err } = await meshulamRequest(requestUrl, requestData)

  if (status !== 1) {
    const { message: errorMessage, id: errorId } = err
    throw createHttpError(500, `Could not create payment process for cart ${cartForOrder._id.toString()} to meshulam API because: ${errorMessage} (${errorId})`)
  }

  return data
}

const createRequestDataForApproveTransaction = (transactionDetails) => {
  const data = new FormData()
  data.append('pageCode', process.env.MESHULAM_API_PAGE_CODE)

  const { customFields, ...rest } = transactionDetails

  Object.keys(customFields).forEach((key) => {
    const value = customFields[key]
    data.append(`customFields[${key}]`, value)
  })

  Object.keys(rest).forEach((key) => {
    const value = transactionDetails[key] || ''
    data.append(key, value)
  })
  return data
}

const approveTransaction = async (transactionDetails) => {
  const requestData = createRequestDataForApproveTransaction(transactionDetails)
  const requestUrl = `${process.env.MESHULAM_API_BASE_URL}/approveTransaction`

  const { status, data, err } = await meshulamRequest(requestUrl, requestData)

  if (status !== 1) {
    const { message: errorMessage, id: errorId } = err
    throw createHttpError(`Could not approve transaction ${transactionDetails.transactionId} from meshulam API because: ${errorMessage} (${errorId})`)
  }

  return data
}

const approveOrder = async (orderId, transactionDetails) => {
  try {
    const update = {
      $set: {
        status: 'approved',
        transaction: transactionDetails
      }
    }
    const updatedOrder = await Order.findByIdAndUpdate(orderId, update)
    return updatedOrder
  } catch (error) {
    throw Error(`FATAL: Failed to update order status (order ${orderId}): ${error.message}`)
  }
}

module.exports = {
  approveOrder,
  approveTransaction,
  createPaymentProcess,
}