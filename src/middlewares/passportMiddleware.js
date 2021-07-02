const passport = require('passport')
const session = require('express-session')
const User = require('../models/User')

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

const secret = process.env.NODE_ENV === 'test'
  ? 'test-secret'
  : process.env.SESSION_SECRET

module.exports = () => [
  session({ secret, resave: false, saveUninitialized: false }),
  passport.initialize(),
  passport.session(),
]