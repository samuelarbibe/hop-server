const express = require('express')
const createHttpError = require('http-errors')
const Const = require('../models/Const')
const logger = require('../utils/logger')

const getConstById = async (req, res, next) => {
  try {
    const { id } = req.params
    const result = await Const.findByIdAndUpdate(id)
    if (!result) {
      next(createHttpError(404, `No Const with ID: ${id}`))
    }
    res.json(result)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not get const by Id'))
  }
}

const getAllConsts = async (req, res, next) => {
  try {
    const consts = await Const.find({})
    const result = consts.reduce((acc, curr) => {
      return { ...acc, [curr._id]: curr.value }
    }, {})
    res.json(result)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not load consts'))
  }
}

const updateConst = async (req, res, next) => {
  try {
    const { _id, value } = req.body
    const updatedConst = await Const.findByIdAndUpdate(_id, { value })
    if (!updatedConst) {
      next(createHttpError(404, `No Const with ID: ${_id}`))
    }

    res.json(updatedConst)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not update const'))
  }
}

const addConst = async (req, res, next) => {
  try {
    const newConst = await Const.create(req.body)
    res.status(201).json(newConst)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not add const'))
  }
}

const deleteConst = async (req, res, next) => {
  try {
    const { id } = req.params
    const deletedConst = await Const.findByIdAndDelete(id)
    if (!deletedConst) {
      next(createHttpError(404, `No Const with ID: ${id}`))
    }

    res.json(deletedConst)
  } catch (error) {
    logger.error(error.message)
    return next(createHttpError(500, 'Could not add const'))
  }
}

const constsRoutes = express.Router()

constsRoutes.post('/', addConst)
constsRoutes.put('/', updateConst)
constsRoutes.get('/', getAllConsts)
constsRoutes.delete('/', deleteConst)
constsRoutes.get('/:id', getConstById)

module.exports = constsRoutes