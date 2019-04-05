import { ConcurrentError } from 'resolve-storage-base'
import { CommandError } from 'resolve-command'

import extractErrorHttpCode from '../utils/extract-error-http-code'
import extractRequestBody from '../utils/extract-request-body'
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
        if (!(error instanceof ConcurrentError)) {
          break
        }
      }
    }

    if (lastError != null) {
      if (lastError instanceof CommandError) {
        lastError.code = 400
      }

      throw lastError
    }

    await res.status(200)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(JSON.stringify(event, null, 2))

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
