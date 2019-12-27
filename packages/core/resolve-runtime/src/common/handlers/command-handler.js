import debugLevels from 'resolve-debug-levels'
import { ConcurrentError } from 'resolve-storage-base'
import { CommandError } from 'resolve-command'

import extractErrorHttpCode from '../utils/extract-error-http-code'
import extractRequestBody from '../utils/extract-request-body'
import message from '../message'

const log = debugLevels('resolve:resolve-runtime:command-handler')

const commandHandler = async (req, res) => {
  const segment = req.resolve.performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('command')

  try {
    const executeCommand = req.resolve.executeCommand
    const commandArgs = extractRequestBody(req)
    let lastError = null
    let event = null

    try {
      event = await executeCommand({ ...commandArgs, jwtToken: req.jwtToken })
    } catch (error) {
      lastError = error
    }

    if (lastError != null) {
      if (lastError instanceof ConcurrentError) {
        lastError.code = 408
      } else if (lastError instanceof CommandError) {
        lastError.code = 400
      }

      throw lastError
    }

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
