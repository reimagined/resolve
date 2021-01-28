/* eslint-disable no-console */

import {
  ClientMiddleware,
  ClientMiddlewareParameters,
  HttpError,
} from '../../src/index'

type ExclusiveState = {
  tokenPromise?: Promise<void> | null
}

const refreshTokenMiddleware = async (
  exclusiveState: ExclusiveState,
  error: Error,
  params: ClientMiddlewareParameters
) => {
  const refresh = async (): Promise<void> => {
    const tokenResponse = await params.fetch(
      'http://localhost:3300/get-token',
      {
        method: 'GET',
        credentials: 'same-origin',
      }
    )
    const body = await tokenResponse.json()
    await params?.jwtProvider?.set(body.token)
  }

  if (exclusiveState.tokenPromise != null) {
    console.log(`${params.info}: another request refreshing token`)
    await exclusiveState.tokenPromise
    console.log(`${params.info}: repeating after refreshing`)
    params.repeat()
  } else {
    if (error instanceof HttpError && error.code === 401) {
      console.log(`${params.info}: locking token refreshing promise`)
      exclusiveState.tokenPromise = refresh()
      await exclusiveState.tokenPromise
      exclusiveState.tokenPromise = null
      console.log(`${params.info}: unlocking promise and repeating`)
      params.repeat()
    }
  }
}

export const createRefreshTokenMiddleware = (
  exclusiveState: ExclusiveState
): ClientMiddleware<Error> => refreshTokenMiddleware.bind(null, exclusiveState)
