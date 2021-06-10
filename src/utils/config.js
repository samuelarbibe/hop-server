switch (process.env.NODE_ENV) {
  case 'development':
    require('dotenv').config({ path: '.env.development' })
    break
  case 'test':
    require('dotenv').config({ path: '.env.test' })
    break
  default:
    require('dotenv').config({ path: '.env.development' })
    break
}