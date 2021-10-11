import Trie from 'route-trie'
import { getRootBasedUrl } from '@resolve-js/core'

import { commandHandler } from './handlers/command-handler'
import { queryHandler } from './handlers/query-handler'
import { markupHandler } from './handlers/markup-handler'
import { uploaderHandler } from './handlers/uploader-handler'
import { failHandler } from './handlers/fail-handler'

import { builtInApiHandlers } from './builtin-routes'

import type { ApiHandlerMeta } from '@resolve-js/core'

export const wrapTrie = (
  apiHandlers: ApiHandlerMeta[],
  staticRoutes: string[] | undefined,
  rootPath: string,
  customStaticHandler?: Function
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

  for (const { method, path, handler } of builtInApiHandlers) {
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
