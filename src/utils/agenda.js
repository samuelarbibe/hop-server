const axios = require('axios')
const Agenda = require('agenda')
const logger = require('./logger')
const Cart = require('../models/Cart')

let agenda

const init = async (dbInstance) => {
  agenda = new Agenda({ mongo: dbInstance })

  agenda.define('delete expired carts', async () => {
    try {
      const currentTime = new Date().getTime()
      const cartExpireTime = new Date(currentTime - 1000 * 60 * 5)

      const query = {
        createdAt: {
          '$lt': cartExpireTime
        }
      }

      const expiredCarts = await Cart.find(query)
      const url = `http://localhost:${process.env.PORT}/api/cart`

      if (expiredCarts.length) {
        const clearPromises = expiredCarts.map(async (cart) => {
          await axios.delete(url, { data: { cartId: cart._id } })
        })

        await Promise.all(clearPromises)
      }
    } catch (error) {
      logger.error(`Failed to run agenda: ${error.message}`)
    }
  })

  await dbInstance.collection('agendaJobs', (err, collection) => collection.deleteMany())
  await agenda.start()
  await agenda.every('10 seconds', 'delete expired carts')

  return agenda
}

module.exports = {
  init,
}