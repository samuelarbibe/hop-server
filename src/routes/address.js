const axios = require('axios')
const express = require('express')
const createHttpError = require('http-errors')

const logger = require('../utils/logger')

const Cart = require('../models/Cart')
const ShippingMethod = require('../models/ShippingMethod')

const getAddressComponent = (address, componentName) => {
  return address?.address_components.find((component) => component.types.includes(componentName))
}

const getAddress = async (req, res, next) => {
  try {
    const { address } = req.params

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json?')
    url.searchParams.append('key', process.env.GOOGLE_API_KEY)
    url.searchParams.append('address', address)
    url.searchParams.append('language', 'iw')
    url.searchParams.append('region', 'il')

    const { data } = await axios.get(url.toString())
    const { status, results } = data

    if (!['OK', 'ZERO_RESULTS'].includes(status)) {
      throw Error('Error in google geocoding api: ' + address)
    }

    const geocodedAddress = results.find((result) => result.formatted_address.includes('תל אביב יפו'))
    const result = {
      streetName: getAddressComponent(geocodedAddress, 'route')?.long_name,
      streetNumber: getAddressComponent(geocodedAddress, 'street_number')?.long_name,
      city: getAddressComponent(geocodedAddress, 'locality')?.long_name,
      country: getAddressComponent(geocodedAddress, 'country')?.long_name,
      geometry: geocodedAddress?.geometry,
      id: geocodedAddress?.place_id
    }

    if (Object.values(result).some((value) => !value)) {
      return next(createHttpError(400, 'We dont send there'))
    }

    req.address = result
    next()
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not geocode address'))
  }
}

const validateAddressForShippingMethod = async (req, res, next) => {
  try {
    const { address } = req
    const cartId = req.fingerprint.hash

    const cart = await Cart.findById(cartId)
    if (!cart) {
      return next(createHttpError(404, `No Cart with ID: ${cartId}`))
    }
    if (!cart.shippingMethod) {
      return next(createHttpError(404, `Cannot get shipping address if no shipping method is selected: ${cartId}`))
    }

    const selectedShippingMethod = await ShippingMethod.findById(cart.shippingMethod)
    if (selectedShippingMethod.type !== 'delivery') {
      return next(createHttpError(404, `Cannot get address for shipping method that is not delivery: ${cart.shippingMethod} in ${cartId}`))
    }

    const { lat, lng } = address.geometry.location
    const query = {
      area: {
        $geoIntersects: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          }
        }
      }
    }
    const isAddressInArea = await ShippingMethod.findOne(query)
    if (!isAddressInArea) {
      return next(createHttpError(400, 'We dont send there'))
    }

    res.send(address)
  } catch (error) {
    if (createHttpError.isHttpError(error)) return next(error)
    logger.error(error.message)
    return next(createHttpError(500, 'Could not validate address'))
  }
}

const addressRoutes = express.Router()
addressRoutes.get('/geocode/:address', getAddress, validateAddressForShippingMethod)

module.exports = addressRoutes