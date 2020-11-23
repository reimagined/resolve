import { ClientMiddlewareParameters, ClientMiddleware } from '../middleware'
import { GenericError } from '../errors'

export type ResponseValidator = (
  response: Response,
  confirm: (result: any) => void,
  deserializer?: (state: string) => any
) => Promise<void>
export type WaitForResponseMiddlewareOptions = {
  validator: ResponseValidator
  attempts: number
  period: number
  debug?: boolean
}

const waitForResponse = async (
  options: WaitForResponseMiddlewareOptions,
  response: Response,
  params: ClientMiddlewareParameters
) => {
  const { waitForState: { currentAttempts } = { currentAttempts: 0 } } =
    params.state ?? {}

  let isValidated = false
  let validResult: any = null

  const confirmResult = (result: any): void => {
    isValidated = true
    validResult = result
  }

  const validator = options.validator

  if (typeof validator === 'function') {
    await validator(response, confirmResult, params.deserializer)
  }

  if (isValidated) {
    params.end({
      headers: response.headers,
      result: validResult,
    })
  } else {
    const isMaxAttemptsReached = currentAttempts >= (options.attempts ?? 0)

    if (isMaxAttemptsReached) {
      throw new GenericError(
        `No valid result received after ${currentAttempts} retries.`
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
): ClientMiddleware<any> => waitForResponse.bind(null, options)
