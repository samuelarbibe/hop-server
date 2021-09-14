const axios = require('axios')
const fetch = require('node-fetch')

const meshulamRequest = async (url, data) => {
  if (process.env.NODE_ENV === 'production') {
    const config = {
      method: 'post',
      url: url,
      headers: data.getHeaders(),
      data: data
    }

    return axios(config).then((response) => response.data)
  }

  const options = {
    method: 'POST',
    body: data,
    redirect: 'follow',
    mode: 'no-cors'
  }

  return fetch(url, options).then(response => response.json())
}

module.exports = meshulamRequest