import println from '../utils/println'
import extractErrorHttpCode from '../utils/extract_error_http_code'

import extractRequestBody from '../utils/extract_request_body'

import message from '../message'

const commandHandler = async (req, res) => {
  if (req.method !== 'POST') {
    await res.status(405)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end('')
    return
  }
  try {
    const executeCommand = req.resolve.executeCommand
    const commandArgs = extractRequestBody(req)
    await executeCommand({ ...commandArgs, jwtToken: req.jwtToken })
    await res.status(200)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(message.commandSuccess)
  } catch (err) {
    const errorCode = extractErrorHttpCode(err)
    await res.status(errorCode)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(`${message.commandFail}${err.message}`)
    println.error(err)
  }
}

export default commandHandler
