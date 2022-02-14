import type {
  RouterOptions,
  OnStartCallback,
  OnFinishCallback,
} from '../../types'
import type { GetCustomParameters } from './wrap-api-handler'

import createTrieRouter from '../../create-trie-router'
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
    createTrieRouter(options),
    getCustomParameters,
    onStart,
    onFinish
  )

export default createRouter
