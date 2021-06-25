require('../src/utils/config')
const mongoose = require('mongoose')
const User = require('../src/models/User')
const mongoURI = process.env.MONGO_URI

const connectDb = async (uri) => {
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
  mongoose.set('useFindAndModify', false)
  mongoose.set('returnOriginal', false)
}

connectDb(mongoURI).then(async () => {
  try {
    await User.register({ username: 'youCan' }, 'try')
    console.log('success')

  } catch (error) {
    console.log('Failed: ' + error)
  }
})