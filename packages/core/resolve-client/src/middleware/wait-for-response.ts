import {
  RequestMiddlewareParameters,
  RequestMiddleware,
} from '../request-middleware'
import { NarrowedResponse } from '../request'
import { GenericError } from '../errors'

export type ResponseValidator = (
  response: NarrowedResponse,
  confirm: (result: any) => void
) => Promise<void>
export type WaitForResponseMiddlewareOptions = {
  validator: ResponseValidator
  attempts: number
  period: number
  debug?: boolean
}

const waitForResponse = async (
  options: WaitForResponseMiddlewareOptions,
  response: NarrowedResponse,
  params: RequestMiddlewareParameters
) => {
  const {
    waitForState: { currentAttempts } = { currentAttempts: 0 },
  } = params.state

  const result = await response.json()

  const { deserializer } = params

  if (
    typeof deserializer === 'function' &&
    result != null &&
    result.data != null
  ) {
    result.data = deserializer(result.data)
  }

  let isValidated = false
  let validResult: any = null

  const confirmResult = (result: any): void => {
    isValidated = true
    validResult = result
  }

  const validator = options.validator

  if (typeof validator === 'function') {
    await validator(response, confirmResult)
  }

  if (isValidated) {
    params.end(validResult)
  } else {
    const isMaxAttemptsReached = currentAttempts >= (options.attempts ?? 0)

    if (isMaxAttemptsReached) {
      throw new GenericError(
        `No valid result received after ${currentAttempts} retries.` +
          (options.debug ? ` Last result ${JSON.stringify(result)}` : '')
      )
    }

    if (options.debug) {
      // eslint-disable-next-line no-console
      console.warn(
        `Unexpected response. Attempting again #${currentAttempts + 1}/${
          options.attempts
        }.`
      )
    }

    const period = options.period

    if (period > 0) {
      await new Promise((resolve) => setTimeout(resolve, period))
    }

    params.repeat()
  }

  return {
    ...params.state,
    waitForState: {
      currentAttempts: currentAttempts + 1,
    },
  }
}

export const createWaitForResponseMiddleware = (
  options: WaitForResponseMiddlewareOptions
): RequestMiddleware<any> => waitForResponse.bind(null, options)
