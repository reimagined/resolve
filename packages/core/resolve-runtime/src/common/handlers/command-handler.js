import debugLevels from 'resolve-debug-levels'
import { ConcurrentError } from 'resolve-eventstore-base'
import { CommandError } from 'resolve-command'

import extractErrorHttpCode from '../utils/extract-error-http-code'
import extractRequestBody from '../utils/extract-request-body'
import message from '../message'

const log = debugLevels('resolve:resolve-runtime:command-handler')

export const executeCommandWithRetryConflicts = async ({
  executeCommand,
  commandArgs,
  jwtToken
}) => {
  const retryCount = commandArgs.immediateConflict != null ? 0 : 10
  let lastError = null
  let event = null

  for (let retry = 0; retry <= retryCount; retry++) {
    try {
      event = await executeCommand({ ...commandArgs, jwtToken })
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
    if (lastError instanceof ConcurrentError) {
      lastError.code = 408
    } else if (lastError instanceof CommandError) {
      lastError.code = 400
    }

    throw lastError
  }

  return event
}

const commandHandler = async (req, res) => {
  const segment = req.resolve.performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('command')

  try {
    const executeCommand = req.resolve.executeCommand
    const commandArgs = extractRequestBody(req)
    const event = await executeCommandWithRetryConflicts({
      executeCommand,
      commandArgs,
      jwtToken: req.jwtToken
    })

    subSegment.addAnnotation('aggregateName', commandArgs.aggregateName)
    subSegment.addAnnotation('aggregateId', commandArgs.aggregateId)
    subSegment.addAnnotation('type', commandArgs.type)
    subSegment.addAnnotation('origin', 'resolve:command')

    await res.status(200)
    await res.setHeader('Content-Type', 'text/plain')
    await res.end(JSON.stringify(event, null, 2))

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
