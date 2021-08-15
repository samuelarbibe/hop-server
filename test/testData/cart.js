const moment = require('moment')

const getCartReadyForOrder = () => ({

  '_id': 'c90e061a7a7deda4c4533f0d1c762903',
  '__v': 0,
  'createdAt': moment().toDate(),
  'expiresAt': moment().add(5, 'minutes').toDate(),
  'items': [
    {
      'productId': '60c28b9872d4c91771372c55',
      'amount': 1
    }
  ],
  'shippingMethod': '60cb9e1d8e90dd24bc056be6',
  'customerDetails': {
    'address': 'שדרות בן גוריון 33, תל אביב יפו',
    'houseNumber': 42,
    'email': 'samuel.arbibe@gmail.com',
    'fullName': 'סמואל ארביב',
    'phoneNumber': '0314423422'
  },
})

module.exports = {
  getCartReadyForOrder
}