import Trie from 'route-trie'

import commandHandler from './handlers/command-handler'
import queryHandler from './handlers/query-handler'
import subscribeHandler from './handlers/subscribe-handler'
import failHandler from './handlers/fail-handler'

import getRootBasedUrl from './utils/get-root-based-url'

const wrapTrie = (apiHandlers, rootPath) => {
  const trie = new Trie({
    ignoreCase: true,
    fixedPathRedirect: true,
    trailingSlashRedirect: true
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
    .define(getRootBasedUrl(rootPath, '/api/subscribe/:wildcard*'))
    .handle('GET', subscribeHandler)
  trie
    .define(getRootBasedUrl(rootPath, '/api/subscribe/:wildcard*'))
    .handle('POST', subscribeHandler)
  trie
    .define(getRootBasedUrl(rootPath, '/api/subscribe'))
    .handle('GET', subscribeHandler)
  trie
    .define(getRootBasedUrl(rootPath, '/api/subscribe'))
    .handle('POST', subscribeHandler)

  for (const { method, path, controller } of apiHandlers) {
    trie
      .define(getRootBasedUrl(rootPath, path))
      .handle(String(method).toUpperCase(), controller)
  }

  const isRootPathEmpty = getRootBasedUrl(rootPath, '/') === '/'
  if (!isRootPathEmpty) {
    trie.define('/:root*').handle('GET', failHandler)
  }

  return trie
}

export default wrapTrie
