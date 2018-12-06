import extractErrorHttpCode from '../utils/extract_error_http_code'
import extractRequestBody from '../utils/extract_request_body'
import message from '../message'

const commandHandler = async (req, res) => {
  try {
    const executeCommand = req.resolve.executeCommand
    const commandArgs = extractRequestBody(req)
    await executeCommand({ ...commandArgs, jwtToken: req.jwtToken })
    await res.status(200)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(message.commandSuccess)

    resolveLog(
      'debug',
      'Command handler executed successfully',
      req.path,
      commandArgs
    )
  } catch (err) {
    const errorCode = extractErrorHttpCode(err)
    await res.status(errorCode)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(`${message.commandFail}${err.message}`)

    resolveLog('error', 'Command handler failed', req.path, err)
  }
}

export default commandHandler
