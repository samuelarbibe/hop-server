const winston = require('winston')

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

const level = () => {
  const env = process.env.NODE_ENV || 'development'
  const isDevelopment = env === 'development'
  return isDevelopment ? 'debug' : 'warn'
}

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
)

const colorize = winston.format.colorize({ all: true })

const options = {
  console: {
    level: 'debug',
    format: winston.format.combine(format, colorize),
  },
  allFile: {
    filename: 'logs/all.log',
    format,
  },
  errorFile: {
    filename: 'logs/error.log',
    level: 'error',
    format,
  }
}

const transports = [
  new winston.transports.Console(options.console),
  new winston.transports.File(options.allFile),
  new winston.transports.File(options.errorFile),
]

const Logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  silent: process.env.NODE_ENV === 'test',
})

module.exports = Logger