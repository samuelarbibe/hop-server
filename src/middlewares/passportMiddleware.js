const passport = require('passport')
const session = require('express-session')
const User = require('../models/User')

passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

module.exports = () => [
  session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }),
  passport.initialize(),
  passport.session(),
]