import Trie from 'route-trie'

import commandHandler from './handlers/command-handler'
import queryHandler from './handlers/query-handler'
import markupHandler from './handlers/markup-handler'
import uploaderHandler from './handlers/uploader-handler'
import failHandler from './handlers/fail-handler'

import getRootBasedUrl from './utils/get-root-based-url'
import buildInApiHandlers from './defaults/builtin-routes'

import type { ApiHandler } from './types'

const wrapTrie = (
  apiHandlers: ApiHandler[],
  staticRoutes: string[] | undefined,
  rootPath: string,
  customStaticHandler: Function
) => {
  const staticHandler =
    typeof customStaticHandler === 'function'
      ? customStaticHandler
      : failHandler
  const trie = new Trie({
    ignoreCase: false,
    fixedPathRedirect: true,
    trailingSlashRedirect: true,
  })

  for (const { method, path, handler } of buildInApiHandlers) {
    trie
      .define(getRootBasedUrl(rootPath, path))
      .handle(
        method,
        handler === 'QUERY'
          ? queryHandler
          : handler === 'COMMAND'
          ? commandHandler
          : handler === 'UPLOADER'
          ? uploaderHandler
          : failHandler
      )
  }

  for (const { method, path, handler } of apiHandlers) {
    trie
      .define(getRootBasedUrl(rootPath, path))
      .handle(String(method).toUpperCase(), handler)
  }

  if (Array.isArray(staticRoutes)) {
    for (const [staticPath] of staticRoutes) {
      trie
        .define(getRootBasedUrl(rootPath, staticPath))
        .handle('GET', staticHandler)

      trie
        .define(getRootBasedUrl(rootPath, staticPath))
        .handle('HEAD', staticHandler)
    }
  }

  try {
    trie
      .define(getRootBasedUrl(rootPath, '/:markup*'))
      .handle('GET', markupHandler)
  } catch (e) {}

  return trie
}

export default wrapTrie
