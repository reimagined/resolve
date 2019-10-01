import Trie from 'route-trie'

import commandHandler from '../handlers/command-handler'
import queryHandler from '../handlers/query-handler'
import subscribeHandler from '../handlers/subscribe-handler'

const wrapTrie = apiHandlers => {
  const trie = new Trie({
    ignoreCase: true,
    fixedPathRedirect: true,
    trailingSlashRedirect: true
  })

  trie.define('/api/query/:wildcard*').handle('GET', queryHandler)
  trie.define('/api/query/:wildcard*').handle('POST', queryHandler)

  trie.define('/api/commands/:wildcard*').handle('POST', commandHandler)

  trie.define('/api/subscribe/:wildcard*').handle('GET', subscribeHandler)
  trie.define('/api/subscribe/:wildcard*').handle('POST', subscribeHandler)

  for (const { method, path, controller } of apiHandlers) {
    trie.define(path).handle(String(method).toUpperCase(), controller)
  }

  return trie
}

export default wrapTrie
