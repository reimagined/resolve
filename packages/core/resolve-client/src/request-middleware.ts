import { FetchFunction } from './request'
import { createParseResponseMiddleware } from './middleware/parse-response'
import { HttpError } from './errors'
import { JSONWebTokenProvider } from './jwt-provider'
export type RequestMiddlewareResult = {
  headers: {
    get: (name: string) => string | null
  }
  result: any
}
export type RequestMiddlewareParameters = {
  fetch: FetchFunction
  info: RequestInfo
  init: RequestInit
  repeat: () => void
  end: (result: RequestMiddlewareResult | Error) => void
  state: any
  deserializer?: (state: string) => any
  jwtProvider?: JSONWebTokenProvider
}
export type RequestMiddleware<TArgument> = (
  argument: TArgument,
  params: RequestMiddlewareParameters
) => Promise<any>
export type RequestMiddlewareOptions = {
  response?: Array<RequestMiddleware<Response>> | RequestMiddleware<Response>
  error?: Array<RequestMiddleware<Error>> | RequestMiddleware<Error>
}

enum MiddlewareRunStatus {
  Running = 'running',
  Finished = 'finished',
  Repeating = 'repeating',
  Error = 'error',
}
type MiddlewareRunState = {
  status: MiddlewareRunStatus
  result: any
  error?: Error
}

export const requestWithMiddleware = async (
  params: {
    fetch: FetchFunction
    init: RequestInit
    info: RequestInfo
    deserializer?: (state: string) => any
    jwtProvider?: JSONWebTokenProvider
  },
  middleware: RequestMiddlewareOptions
): Promise<RequestMiddlewareResult | Error> => {
  const responseMiddleware = new Array<RequestMiddleware<Response>>().concat(
    middleware.response ?? [createParseResponseMiddleware()]
  )
  const errorMiddleware = new Array<RequestMiddleware<Error>>().concat(
    middleware.error ?? []
  )

  const { info, init, deserializer, jwtProvider } = params
  let userState: any = null

  async function execMiddleware<TArgument>(
    argument: TArgument,
    middlewareChain: Array<RequestMiddleware<TArgument>>
  ): Promise<MiddlewareRunState> {
    const runState: MiddlewareRunState = {
      status: MiddlewareRunStatus.Running,
      result: null,
    }
    const end = (result: any) => {
      if (result instanceof Error) {
        runState.status = MiddlewareRunStatus.Error
        runState.error = result
      } else {
        runState.status = MiddlewareRunStatus.Finished
        runState.result = result
      }
    }
    const repeat = () => {
      runState.status = MiddlewareRunStatus.Repeating
    }

    for (const middleware of middlewareChain) {
      try {
        userState = await middleware(argument, {
          fetch,
          init,
          info,
          end,
          repeat,
          state: userState,
          deserializer,
          jwtProvider,
        })
      } catch (error) {
        runState.status = MiddlewareRunStatus.Error
        runState.error = error
        break
      }

      if (runState.status !== MiddlewareRunStatus.Running) {
        break
      }
    }

    if (runState.status === MiddlewareRunStatus.Running) {
      runState.status = MiddlewareRunStatus.Finished
      runState.result = argument
    }

    return runState
  }

  const execFetch = async (): Promise<any> => {
    const processRun = async (
      runState: MiddlewareRunState,
      execErrorMiddleware: boolean
    ): Promise<any> => {
      switch (runState.status) {
        case MiddlewareRunStatus.Finished:
          return runState.result

        case MiddlewareRunStatus.Repeating:
          return await execFetch()

        case MiddlewareRunStatus.Error:
          if (runState.error) {
            if (execErrorMiddleware) {
              return await processRun(
                await execMiddleware(runState.error, errorMiddleware),
                false
              )
            }
            throw runState.error
          }
          throw Error(
            `Middleware run status is "${runState.status}, but no error was set.`
          )

        case MiddlewareRunStatus.Running:
        default:
          throw Error(
            `Unpredictable middleware run status "${runState.status}". Check your middleware functions.`
          )
      }
    }

    const headers = init.headers as Record<string, string>
    const token = await jwtProvider?.get()
    if (token && init?.headers != null) {
      headers['Authorization'] = `Bearer ${token}`
    }

    let response: Response | null = null
    try {
      response = await fetch(info, init)
    } catch (error) {
      return await processRun(
        await execMiddleware(error, errorMiddleware),
        false
      )
    }

    if (!response.ok) {
      return await processRun(
        await execMiddleware(
          new HttpError(response.status, await response.json()),
          errorMiddleware
        ),
        false
      )
    }

    const result = await processRun(
      await execMiddleware(response, responseMiddleware),
      true
    )

    if (jwtProvider && response.headers) {
      await jwtProvider.set(response.headers.get('x-jwt') ?? '')
    }

    return result
  }

  return await execFetch()
}
