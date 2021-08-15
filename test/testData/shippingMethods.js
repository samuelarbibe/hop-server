const shippingMethods = [
  {
    type: 'pickup',
    name: 'איסוף עצמי',
    price: 0,
    stock: 9999999,
    tempStock: 9999999,
    description: 'איסוף עצמי מרחוב הרכבת 16 תל אביב',
    from: new Date('2021-07-06T13:00:00.000+03:00'),
    to: new Date('2021-07-06T18:00:00.000+03:00')
  },
  {
    type: 'delivery',
    name: 'משלוח',
    price: 15,
    stock: 30,
    tempStock: 30,
    description: 'משלוח לתל אביב בלבד',
    from: new Date('2021-07-06T13:00:00.000+03:00'),
    to: new Date('2021-07-06T18:00:00.000+03:00')
  }
]

module.exports = shippingMethods