import type { RouterOptions, OnFinishCallback, OnStartCallback } from '../types'
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
  wrapApiHandler(createBaseRouter(options))

export default createRouter
