import type { RouterOptions } from '../types'

import createBaseRouter from '../create-router'
import wrapApiHandler from './wrap-api-handler'

const createRouter = <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  options: RouterOptions<CustomParameters>
) => wrapApiHandler(createBaseRouter(options))

export default createRouter
