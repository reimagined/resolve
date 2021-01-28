import { ClientMiddleware, ClientMiddlewareParameters } from '../middleware'
import { HttpError } from '../errors'

export type RetryOnErrorMiddlewareOptions = {
  errors: number[] | number
  attempts: number
  period: number
  debug?: boolean
}

const retryOnError = async (
  options: RetryOnErrorMiddlewareOptions,
  error: Error | HttpError,
  params: ClientMiddlewareParameters
): Promise<any> => {
  const expectedErrors = new Array<number>().concat(options.errors)

  if (expectedErrors.length && error instanceof HttpError) {
    const { retryOnErrorState: { currentAttempts } = { currentAttempts: 0 } } =
      params.state ?? {}

    const isErrorExpected = expectedErrors.includes(error.code)
    const isMaxAttemptsReached = currentAttempts >= options.attempts ?? 0

    if (isErrorExpected && !isMaxAttemptsReached) {
      if (options?.debug) {
        // eslint-disable-next-line no-console
        console.warn(
          `Error code ${error.code} was expected. Attempting again #${
            currentAttempts + 1
          }/${options.attempts}.`
        )
      }

      const period = options.period

      if (period > 0) {
        await new Promise((resolve) => setTimeout(resolve, period))
      }

      params.repeat()
    } else {
      params.end(error)
    }

    return {
      ...params.state,
      retryOnErrorState: {
        currentAttempts: currentAttempts + 1,
      },
    }
  }
}

export const createRetryOnErrorMiddleware = (
  options: RetryOnErrorMiddlewareOptions
): ClientMiddleware<any> => retryOnError.bind(null, options)
