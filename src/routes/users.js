const express = require('express')
const passport = require('passport')

const userRoutes = express.Router()
userRoutes.post('/login', (req, res, next) => {
  passport.authenticate('local',
    (err, user) => {
      if (err) {
        return next(err)
      }

      if (!user) {
        return res.json({ authenticated: false })
      }

      req.logIn(user, (err) => {
        if (err) {
          return next(err)
        }

        return res.json({ authenticated: true })
      })
    })(req, res, next)
})

module.exports = userRoutes