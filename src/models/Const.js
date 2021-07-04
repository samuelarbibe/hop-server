const mongoose = require('mongoose')
const { Schema } = mongoose

const constSchema = new Schema({
  _id: String,
  value: Schema.Types.Mixed,
})

const Const = mongoose.model('const', constSchema)

module.exports = Const