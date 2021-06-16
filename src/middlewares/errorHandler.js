const logger = require('../utils/logger')

const errorHandler = (error, req, res, next) => {
  logger.error(error.message)
  res.status(error.status).json({
    status: error.name,
    statusCode: error.status,
    message: error.message,
  })
}

module.exports = errorHandler