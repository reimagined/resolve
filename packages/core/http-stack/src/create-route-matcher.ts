import type { Trie } from 'route-trie'

import type { HttpRequest, HttpResponse } from './types'

const createRouteMatcher = <
  CustomParameters extends Record<string | symbol, any> = {}
>(
  trie: Trie,
  notFoundHandler: (
    req: HttpRequest<CustomParameters>,
    res: HttpResponse
  ) => Promise<void> | void
) => async (req: HttpRequest<CustomParameters>, res: HttpResponse) => {
  const { node, params, fpr, tsr } = trie.match(req.path)

  if (fpr != null && fpr !== '') {
    return void (await res.redirect(fpr))
  } else if (tsr != null && tsr !== '') {
    return void (await res.redirect(tsr))
  } else if (node == null) {
    return void (await notFoundHandler(req, res))
  }

  const handler: (
    req: HttpRequest<CustomParameters>,
    res: HttpResponse
  ) => Promise<void> | undefined = node.getHandler(req.method.toUpperCase())

  ;(req as any).params = params

  if (typeof handler === 'function') {
    await handler(req, res)
  } else {
    await notFoundHandler(req, res)
  }
}

export default createRouteMatcher
