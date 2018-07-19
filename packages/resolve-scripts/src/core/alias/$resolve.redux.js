import { envKey } from 'json-env-extract'

import { message } from '../constants'

import resolveFile from '../resolve_file'

export default ({ resolveConfig }) => {
  if (!resolveConfig.redux) {
    throw new Error(`${message.configNotContainSectionError}.redux`)
  }

  if (resolveConfig.redux.store in resolveConfig[envKey]) {
    throw new Error(`${message.clientEnvError}.redux.store`)
  }
  const store = resolveFile(resolveConfig.redux.store, 'client/store/index.js')

  if (resolveConfig.redux.reducers in resolveConfig[envKey]) {
    throw new Error(`${message.clientEnvError}.redux.reducers`)
  }
  const reducers = resolveFile(resolveConfig.redux.reducers, 'client/reducers/index.js')

  if (resolveConfig.redux.middlewares in resolveConfig[envKey]) {
    throw new Error(`${message.clientEnvError}.redux.middlewares`)
  }
  const middlewares = resolveFile(resolveConfig.redux.middlewares, 'client/middlewares/index.js')

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
