import debugLevels from '@resolve-js/debug-levels'

import extractErrorHttpCode from '../utils/extract-error-http-code'
import extractRequestBody from '../utils/extract-request-body'
import message from '../message'

const log = debugLevels('resolve:runtime:command-handler')

function isConcurrentError(error) {
  return error.name === 'ConcurrentError'
}

function isCommandError(error) {
  return error.name === 'CommandError'
}

export const executeCommandWithRetryConflicts = async (
  { executeCommand, commandArgs, jwt },
  middlewareContext
) => {
  const retryCount = commandArgs.immediateConflict != null ? 0 : 10
  let lastError = null
  let result = null

  for (let retry = 0; retry <= retryCount; retry++) {
    try {
      result = await executeCommand({ ...commandArgs, jwt }, middlewareContext)
      lastError = null
      break
    } catch (error) {
      lastError = error
      if (!isConcurrentError(error)) {
        break
      }
    }
  }

  if (lastError != null) {
    if (isConcurrentError(lastError)) {
      lastError.code = 409
    } else if (isCommandError(lastError)) {
      lastError.code = 400
    }

    throw lastError
  }

  return result
}

const commandHandler = async (req, res) => {
  const segment = req.resolve.performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('command')

  try {
    const executeCommand = req.resolve.executeCommand
    const commandArgs = extractRequestBody(req)
    const result = await executeCommandWithRetryConflicts(
      {
        executeCommand,
        commandArgs,
        jwt: req.jwt,
      },
      { req, res }
    )

    subSegment.addAnnotation('aggregateName', commandArgs.aggregateName)
    subSegment.addAnnotation('aggregateId', commandArgs.aggregateId)
    subSegment.addAnnotation('type', commandArgs.type)
    subSegment.addAnnotation('origin', 'resolve:command')

    await res.status(200)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(JSON.stringify(result))

    log.debug('Command handler executed successfully', req.path, commandArgs)
  } catch (err) {
    const errorCode = extractErrorHttpCode(err)
    await res.status(errorCode)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(`${message.commandFail}${err.message}`)

    subSegment.addError(err)

    log.error('Command handler failed', req.path, err)
  } finally {
    subSegment.close()
  }
}

export default commandHandler
