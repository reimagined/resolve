import Trie from 'route-trie'

import commandHandler from './handlers/command-handler'
import queryHandler from './handlers/query-handler'
import markupHandler from './handlers/markup-handler'
import uploaderHandler from './handlers/uploader-handler'

import getRootBasedUrl from './utils/get-root-based-url'

const wrapTrie = (apiHandlers, rootPath) => {
  const trie = new Trie({
    ignoreCase: true,
    fixedPathRedirect: true,
    trailingSlashRedirect: true,
  })

  trie
    .define(getRootBasedUrl(rootPath, '/api/query/:wildcard*'))
    .handle('GET', queryHandler)
  trie
    .define(getRootBasedUrl(rootPath, '/api/query/:wildcard*'))
    .handle('POST', queryHandler)
  trie
    .define(getRootBasedUrl(rootPath, '/api/query'))
    .handle('GET', queryHandler)
  trie
    .define(getRootBasedUrl(rootPath, '/api/query'))
    .handle('POST', queryHandler)

  trie
    .define(getRootBasedUrl(rootPath, '/api/commands/:wildcard*'))
    .handle('POST', commandHandler)
  trie
    .define(getRootBasedUrl(rootPath, '/api/commands'))
    .handle('POST', commandHandler)

  trie
    .define(getRootBasedUrl(rootPath, '/uploader'))
    .handle('POST', uploaderHandler)
  trie
    .define(getRootBasedUrl(rootPath, '/uploader'))
    .handle('PUT', uploaderHandler)
  trie
    .define(getRootBasedUrl(rootPath, '/uploader/:params*'))
    .handle('GET', uploaderHandler)

  for (const { method, path, handler } of apiHandlers) {
    trie
      .define(getRootBasedUrl(rootPath, path))
      .handle(String(method).toUpperCase(), handler)
  }

  try {
    trie
      .define(getRootBasedUrl(rootPath, '/:markup*'))
      .handle('GET', markupHandler)
  } catch (e) {}

  return trie
}

export default wrapTrie
