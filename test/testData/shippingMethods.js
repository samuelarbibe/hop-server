const shippingMethods = [
  {
    name: "pickup",
    displayName: "איסוף עצמי",
    price: 0,
    stock: 9999999,
    tempStock: 9999999,
    description: "איסוף עצמי מרחוב הרכבת 16 תל אביב",
  },
  {
    name: "delivery",
    displayName: "משלוח",
    price: 15,
    stock: 30,
    tempStock: 30,
    description: "משלוח לתל אביב בלבד",
  }
]

module.exports = shippingMethods