const express = require('express')
const passport = require('passport')

const userRoutes = express.Router()

const loginHandler = (req, res, next) => {
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
}

const isLoggedInHandler = (req, res) => {
  res.send({ authenticated: !!req.user })
}

const logoutHandler = (req, res) => {
  req.logout()
  res.send({ authenticated: false })
}

userRoutes.get('/login', isLoggedInHandler)
userRoutes.post('/login', loginHandler)
userRoutes.post('/logout', logoutHandler)

module.exports = userRoutes