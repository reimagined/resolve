import debugLevels from '@resolve-js/debug-levels'

import { extractErrorHttpCode, extractRequestBody } from '../utils'
import { messages } from '../messages'

import type { ResolveRequest, ResolveResponse } from '../types'
import type { CommandExecutor } from '../command'
import type { MiddlewareContext } from '@resolve-js/core'

const log = debugLevels('resolve:runtime:command-handler')

function isConcurrentError(error: any) {
  return error.name === 'ConcurrentError'
}

function isCommandError(error: any) {
  return error.name === 'CommandError'
}

const DEFAULT_RETRY_COUNT = 3

const executeCommandWithRetryConflicts = async (
  {
    executeCommand,
    commandArgs,
    jwt,
  }: { executeCommand: CommandExecutor; commandArgs: any; jwt?: string },
  middlewareContext: MiddlewareContext
) => {
  const retryCount =
    commandArgs.immediateConflict != null ? 0 : DEFAULT_RETRY_COUNT
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

export const commandHandler = async (
  req: ResolveRequest,
  res: ResolveResponse
) => {
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
      // TODO ????
      { req: req as any, res }
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
    await res.end(`${messages.commandFail}${err.message}`)

    subSegment.addError(err)

    log.error('Command handler failed', req.path, err)
  } finally {
    subSegment.close()
  }
}
