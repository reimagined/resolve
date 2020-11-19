import { FetchFunction } from './request'
import { createParseResponseMiddleware } from './middleware/parse-response'
import { HttpError } from './errors'
import { JSONWebTokenProvider } from './jwt-provider'
import { readJSONOrText } from './utils'

export type ClientMiddlewareResult = {
  headers: {
    get: (name: string) => string | null
  }
  result: any
}
export type ClientMiddlewareParameters = {
  fetch: FetchFunction
  info: RequestInfo
  init: RequestInit
  repeat: () => void
  end: (result: ClientMiddlewareResult | Error) => void
  state: any
  deserializer?: (state: string) => any
  jwtProvider?: JSONWebTokenProvider
}
export type ClientMiddleware<TArgument> = (
  argument: TArgument,
  params: ClientMiddlewareParameters
) => Promise<any>
export type ClientMiddlewareOptions = {
  response?: Array<ClientMiddleware<Response>> | ClientMiddleware<Response>
  error?: Array<ClientMiddleware<Error>> | ClientMiddleware<Error>
}

enum ClientMiddlewareRunStatus {
  Running = 'running',
  Finished = 'finished',
  Repeating = 'repeating',
  Error = 'error',
}
type ClientMiddlewareRunState = {
  status: ClientMiddlewareRunStatus
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
  middleware: ClientMiddlewareOptions
): Promise<ClientMiddlewareResult | Error> => {
  const responseMiddleware = new Array<ClientMiddleware<Response>>()
    .concat(middleware.response ?? [])
    .concat(createParseResponseMiddleware())
  const errorMiddleware = new Array<ClientMiddleware<Error>>().concat(
    middleware.error ?? []
  )

  const { info, init, deserializer, jwtProvider } = params
  let userState: any = null

  async function execMiddleware<TArgument>(
    argument: TArgument,
    middlewareChain: Array<ClientMiddleware<TArgument>>
  ): Promise<ClientMiddlewareRunState> {
    console.log(`executing middleware chain ${middlewareChain.length}`)
    const runState: ClientMiddlewareRunState = {
      status: ClientMiddlewareRunStatus.Running,
      result: null,
    }
    const end = (result: any) => {
      if (result instanceof Error) {
        runState.status = ClientMiddlewareRunStatus.Error
        runState.error = result
      } else {
        runState.status = ClientMiddlewareRunStatus.Finished
        runState.result = result
      }
    }
    const repeat = () => {
      runState.status = ClientMiddlewareRunStatus.Repeating
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
        runState.status = ClientMiddlewareRunStatus.Error
        runState.error = error
        break
      }

      if (runState.status !== ClientMiddlewareRunStatus.Running) {
        break
      }
    }

    if (runState.status === ClientMiddlewareRunStatus.Running) {
      runState.status = ClientMiddlewareRunStatus.Finished
      runState.result = argument
    }

    return runState
  }

  const execFetch = async (): Promise<any> => {
    const processRun = async (
      runState: ClientMiddlewareRunState,
      execErrorMiddleware: boolean
    ): Promise<any> => {
      switch (runState.status) {
        case ClientMiddlewareRunStatus.Finished:
          return runState.result

        case ClientMiddlewareRunStatus.Repeating:
          return await execFetch()

        case ClientMiddlewareRunStatus.Error:
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

        case ClientMiddlewareRunStatus.Running:
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
          new HttpError(response.status, await response.text()),
          errorMiddleware
        ),
        false
      )
    }

    console.log(`response ok, calling normal middleware`)

    const result = await processRun(
      await execMiddleware(response, responseMiddleware),
      true
    )

    console.log(`updating jwt`)

    if (jwtProvider && response.headers) {
      await jwtProvider.set(response.headers.get('x-jwt') ?? '')
    }

    console.log(`returning result`)

    return result
  }

  return await execFetch()
}
