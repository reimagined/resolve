import { ConcurrentError } from 'resolve-storage-base'

import extractErrorHttpCode from '../utils/extract_error_http_code'
import extractRequestBody from '../utils/extract_request_body'
import message from '../message'

const CONCURRENT_RETRY_COUNT = 3

const commandHandler = async (req, res) => {
  try {
    const executeCommand = req.resolve.executeCommand
    const commandArgs = extractRequestBody(req)
    let lastError = null
    let event = null

    for (let i = 0; i < CONCURRENT_RETRY_COUNT; i++) {
      try {
        event = await executeCommand({ ...commandArgs, jwtToken: req.jwtToken })
        lastError = null
        break
      } catch (error) {
        lastError = error
        if (!error instanceof ConcurrentError) {
          break
        }
      }
    }

    if (lastError != null) {
      throw lastError
    }

    await res.status(200)
    await res.setHeader('Content-Type', 'text/plain')
    await res.json(event)

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
