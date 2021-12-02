import type { Trie as ITrie, TrieOptions } from 'route-trie'
import Trie from 'route-trie'

import type { HttpRequest, HttpResponse, HttpMethods, CORS } from './types'

class Router<CustomParameters extends Record<string | symbol, any> = {}> {
  #cors: CORS
  #enableCors: boolean
  #trie: ITrie
  #failHandler: (
    req: HttpRequest<CustomParameters>,
    res: HttpResponse
  ) => Promise<void>
  #corsMiddleware(req: HttpRequest<{}>, res: HttpResponse) {
    const { origin } = this.#cors

    if (typeof origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', origin)
    } else if (
      origin === true ||
      (Array.isArray(origin) &&
        origin.every((item) => item != null && item.constructor === String) &&
        req.headers.origin != null &&
        origin.includes(req.headers.origin)) ||
      (origin != null &&
        origin.constructor === RegExp &&
        origin.test(req.headers.origin))
    ) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
      res.setHeader('Vary', 'Origin') // TODO res.vary(header: string)
    } else {
      return
    }

    res.setHeader('Access-Control-Allow-Methods', '*')
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, Content-Type, Accept, x-resolve-execution-mode'
    )
  }
  constructor(
    cors: CORS = {},
    options: TrieOptions = {
      ignoreCase: true,
      fixedPathRedirect: true,
      trailingSlashRedirect: true,
    }
  ) {
    this.#cors = cors
    this.#enableCors = Object.keys(cors).length > 0

    this.#trie = new Trie(options)
  }
  on(
    pattern: string,
    method: HttpMethods,
    handler: (
      req: HttpRequest<CustomParameters>,
      res: HttpResponse
    ) => Promise<void>
  ) {
    this.#trie.define(pattern).handle(method, handler)
    try {
      this.#trie.define(pattern).handle('OPTIONS', this.#corsHandler)
    } catch {}
  }
  fail(
    handler: (
      req: HttpRequest<CustomParameters>,
      res: HttpResponse
    ) => Promise<void>
  ) {}
}

const createRouter = () => new Router()

const clientApiHandler = async (
  req: InternalRequest<Context>,
  res: InternalResponse
): Promise<void> => {
  const { node, params, fpr, tsr } = trie.match(req.path)

  if (fpr != null && fpr !== '') {
    return void (await res.redirect(fpr))
  } else if (tsr != null && tsr !== '') {
    return void (await res.redirect(tsr))
  } else if (node == null) {
    return void (await failHandler(req, res))
  }

  req.params = () => params

  const handler = node.getHandler(req.method.toUpperCase())

  if (typeof handler !== 'function') {
    return void (await failHandler(req, res))
  }

  try {
    await handler(req, res)
  } catch (error) {
    res.status(Number.isInteger(error.code) ? error.code : 500)
    res.end(`${error.message}`)
  }
}

export default clientApiHandler
