const createHttpError = require('http-errors')

const isAuth = (req, res, next) => {
  if (req.user) return next()
  return next(createHttpError(403, 'Unauthorized'))
}

module.exports = {
  isAuth,
}