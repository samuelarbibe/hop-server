const fingerprint = require('express-fingerprint')

const fingerprintMiddleware = fingerprint({
  parameters: [
    fingerprint.useragent,
    fingerprint.acceptHeaders,
    fingerprint.geoip,
  ]
})

module.exports = fingerprintMiddleware