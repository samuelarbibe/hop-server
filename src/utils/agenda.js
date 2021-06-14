const Agenda = require('agenda')
const logger = require('./logger')
const Cart = require('../models/Cart')

let agenda

const init = async (dbInstance) => {
  agenda = new Agenda({ mongo: dbInstance })

  agenda.define('delete expired carts', async () => {
    try {
      const currentTime = new Date().getTime()
      const fifteenMinutsAgo = new Date(currentTime - 1000 * 60 * 15)

      const query = {
        createdAt: {
          '$lt': fifteenMinutsAgo
        }
      }

      const expiredCarts = await Cart.find(query)

      if (expiredCarts.length) {
        const clearPromises = expiredCarts.map(async (cart) => {
          await Cart.empty(cart._id)
        })

        await Promise.all(clearPromises)
      }
    } catch (error) {
      logger.error(`Failed to run agenda: ${error.message}`)
    }
  })

  await agenda.start()
  await agenda.purge()
  await agenda.every('10 seconds', 'delete expired carts')

  return agenda
}

module.exports = {
  init,
}