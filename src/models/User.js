const mongoose = require('mongoose')
const passportLocalMongoose = require('passport-local-mongoose')

const Schema = mongoose.Schema

const UserSchema = new Schema({
  username: String,
  password: String
})

UserSchema.plugin(passportLocalMongoose)
const User = mongoose.model('user', UserSchema)

module.exports = User