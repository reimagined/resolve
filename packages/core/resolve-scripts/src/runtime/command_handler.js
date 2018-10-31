import println from './utils/println'
import executeCommand from './command_executor'
import extractErrorHttpCode from './utils/extract_error_http_code'

const message = require('../../configs/message.json')

const commandHandler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end()
  }
  try {
    await executeCommand({ ...req.body, jwtToken: req.jwtToken })
    res.status(200).send(message.commandSuccess)
  } catch (err) {
    const errorCode = extractErrorHttpCode(err)
    res.status(errorCode).end(`${message.commandFail}${err.message}`)
    println.error(err)
  }
}

export default commandHandler
