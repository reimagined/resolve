import { message } from '../constants'

import resolveFile from '../resolve_file'

export default ({ resolveConfig }) => {
  if (!resolveConfig.redux) {
    throw new Error(`${message.configNotContainSectionError}.redux`)
  }

  const store = resolveFile(resolveConfig.redux.store, 'redux_store.js')

  const reducers = resolveFile(
    resolveConfig.redux.reducers,
    'redux_reducers.js'
  )

  const middlewares = resolveFile(
    resolveConfig.redux.middlewares,
    'redux_middlewares.js'
  )

  const exports = []

  exports.push(
    `import store from ${JSON.stringify(store)}`,
    `import reducers from ${JSON.stringify(reducers)}`,
    `import middlewares from ${JSON.stringify(middlewares)}`,
    ``,
    `export default {`,
    `  store, reducers, middlewares`,
    `}`
  )

  return {
    code: exports.join('\r\n')
  }
}
