import type { TrieOptions } from 'route-trie'

import type { CORS, Route, RouterOptions } from './types'
import type {
  HttpRequest,
  HttpResponse,
  OnFinishCallback,
  OnStartCallback,
} from './types'

class RouterConfigBuilder<
  CustomParameters extends Record<string | symbol, any> = {},
  GetCustomParametersArgs extends Array<any> = never
> {
  readonly #config: RouterOptions<CustomParameters> = { routes: [] }
  readonly #getCustomParameters?: (
    ...args: GetCustomParametersArgs
  ) => CustomParameters | Promise<CustomParameters>
  readonly #onStart?: OnStartCallback<CustomParameters>
  readonly #onFinish?: OnFinishCallback<CustomParameters>
  constructor(
    getCustomParameters?: (
      ...args: GetCustomParametersArgs
    ) => CustomParameters | Promise<CustomParameters>
  ) {
    this.#getCustomParameters = getCustomParameters
  }
  addRoute(route: Route<CustomParameters>) {
    this.#config.routes.push(route)
    return this
  }
  setupCORS(cors: CORS) {
    this.#config.cors = cors
    return this
  }
  setupTrie(trie: TrieOptions) {
    this.#config.options = trie
    return this
  }
  setNotFoundHandler(
    notFoundHandler: (
      req: HttpRequest<CustomParameters>,
      res: HttpResponse
    ) => Promise<void> | void
  ) {
    this.#config.notFoundHandler = notFoundHandler
    return this
  }
  instantiate() {
    const config = Object.freeze(this.#config)
    const { routes, cors, options } = config
    const getCustomParameters = this.#getCustomParameters
    const onStart = this.#onStart
    const onFinish = this.#onFinish

    Object.freeze(routes)
    Object.freeze(cors)
    Object.freeze(options)

    for (const methodName of [
      '#config',
      '#getCustomParameters',
      '#onStart',
      '#onFinish',
      'addRoute',
      'setupCORS',
      'setupTrie',
      'setNotFoundHandler',
      'instantiate',
    ]) {
      delete (this as any)[methodName]
    }

    return {
      ...config,
      getCustomParameters,
      onStart,
      onFinish,
    }
  }
}

export default RouterConfigBuilder
