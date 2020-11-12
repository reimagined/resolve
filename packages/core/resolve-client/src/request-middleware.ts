import { FetchFunction, NarrowedResponse } from './request'

export type RequestMiddlewareParameters = {
  fetch: FetchFunction
  info: RequestInfo
  init: RequestInit
  repeat: () => void
  end: (result: any) => void
  state: any
  deserializer?: (state: string) => any
}
export type RequestMiddleware<TArgument> = (
  argument: TArgument,
  params: RequestMiddlewareParameters
) => Promise<any>
export type RequestMiddlewareOptions = {
  response?:
    | Array<RequestMiddleware<NarrowedResponse>>
    | RequestMiddleware<NarrowedResponse>
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
  },
  middleware: RequestMiddlewareOptions
): Promise<NarrowedResponse> => {
  const responseMiddleware = new Array<
    RequestMiddleware<NarrowedResponse>
  >().concat(middleware.response ?? [])
  const errorMiddleware = new Array<RequestMiddleware<Error>>().concat(
    middleware.error ?? []
  )

  let userState: any = null

  async function execMiddleware<TArgument>(
    response: TArgument,
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
        userState = await middleware(response, {
          fetch,
          init,
          info,
          end,
          repeat,
          state: userState,
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
      runState.result = response
    }

    return runState
  }

  const { info, init } = params
  const execFetch = async (): Promise<any> => {
    const processRun = async (runState: MiddlewareRunState): Promise<any> => {
      switch (runState.status) {
        case MiddlewareRunStatus.Finished:
          return runState.result
        case MiddlewareRunStatus.Repeating:
          return await execFetch()
        case MiddlewareRunStatus.Error:
          if (runState.error) {
            return await processRun(
              await execMiddleware(runState.error, errorMiddleware)
            )
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

    let response: NarrowedResponse | null = null
    try {
      response = await fetch(info, init)
    } catch (error) {
      return await processRun(await execMiddleware(error, errorMiddleware))
    }
    return await processRun(await execMiddleware(response, responseMiddleware))
  }
  return await execFetch()
}
