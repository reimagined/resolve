import type { RouterOptions, OnStartCallback, OnFinishCallback } from '../types'
import type { GetCustomParameters } from './wrap-api-handler'

import createBaseRouter from '../create-router'
import wrapApiHandler from './wrap-api-handler'

const createRouter = <
  CustomParameters extends Record<string | symbol, any> = {}
>({
  getCustomParameters,
  onStart,
  onFinish,
  ...options
}: {
  getCustomParameters?: GetCustomParameters<CustomParameters>
  onStart?: OnStartCallback<CustomParameters>
  onFinish?: OnFinishCallback<CustomParameters>
} & RouterOptions<CustomParameters>) =>
  wrapApiHandler(
    createBaseRouter(options),
    getCustomParameters,
    onStart,
    onFinish
  )

export default createRouter
