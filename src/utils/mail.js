const moment = require('moment')
const nodemailer = require('nodemailer')
const Order = require('../models/Order')

const getMessage = (order) => {
  const { email, fullName } = order.cart.customerDetails
  const html = getEmailHtml(order)

  const message = {
    from: `HOP <${process.env.EMAIL_USER}>`,
    to: `${fullName} <${email}>`,
    subject: 'HOP - Order confirmation',
    priority: 'high',
    html
  }

  return message
}

const getTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})


const sendMail = async (orderId) => {
  try {
    const order = await Order.findById(orderId).lean()

    const transporter = getTransporter()
    const message = getMessage(order)

    return await transporter.sendMail(message)
  } catch (error) {
    throw Error(`FATAL: Could not send confirmation mail for order ${orderId}: ${error.message}`)
  }
}

const getEmailHtml = (order) => `
<html lang="he">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HOP</title>
  <link href="https://fonts.googleapis.com/css2?family=Rubik&display=swap" rel="stylesheet">
</head>
<style>
  html {
    height: 100%;
    font-family: 'Rubik';
  }

  body {
    margin: 0;
    padding: 20px;
  }

  table {
    border-collapse: collapse;
    margin: 20px 0px;
  }

  th, td {
    padding: 5px;
    min-width: 100px;
    border: 1px solid rgb(119, 119, 119);
  }

  th {
    text-align: right;
  }

  tr:nth-child(even) {
    background-color: #f2f2f2;
  }
</style>

<body dir='rtl'>
  <h1>הזמנה מספר ${order._id}</h1>
  <p>אסמכתא: ${order.transaction.asmachta}</p>
  <p>תאריך תשלום: ${order.transaction.paymentDate}</p>
  <table>
    <tr>
      <th>שם פריט</th>
      <th>כמות</th>
      <th>מחיר</th>
    </tr>
  ${order.cart.items.map((item) => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.productPrice}</td>
        <td>${item.amount * item.productPrice} ₪</td>
      </tr>
    `)
  }
    <tr>
      <td>${order.cart.shippingMethod.name}</td>
      <td>1</td>
      <td>${order.cart.shippingMethod.price} ₪ </א>
    </tr>
    <tr>
      <td></td>
      <td></td>
      <th>סה"כ: ${order.transaction.sum} ₪ </th>
    </tr>
  </table>
  <h4>פרטי ${order.cart.shippingMethod.type === 'delivery' ? 'משלוח' : 'איסוף עצמי'}:</h4>
  <u>כתובת:</u> <span> ${order.cart.shippingMethod.type === 'delivery'
    ? order.cart.customerDetails.address + `${order.cart.customerDetails.homeNumber ? `דירה ${order.cart.customerDetails.homeNumber}` : ''}`
    : 'הרכבת 16, תל אביב יפו'
  }</span><br />
  <u>זמן:</u> <span> ${(() => {
    const option = order.cart.shippingMethod
    const day = moment(option.from).format('DD/MM')
    const hourFrom = new Date(option.from).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    const hourTo = new Date(option.to).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })

    return `${day}: ${hourFrom} - ${hourTo}`
  })()}</span><br />
  <h2>HOP</h2>
</body>

</html>
`

module.exports = {
  sendMail
}