import { message } from '../constants'
import resolveFile from '../resolve_file'
import { checkRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig }) => {
  if (!resolveConfig.redux) {
    throw new Error(`${message.configNotContainSectionError}.redux`)
  }

  if (checkRuntimeEnv(resolveConfig.redux.store)) {
    throw new Error(`${message.clientEnvError}.redux.store`)
  }
  const store = resolveFile(resolveConfig.redux.store, 'redux_store.js')

  if (checkRuntimeEnv(resolveConfig.redux.reducers)) {
    throw new Error(`${message.clientEnvError}.redux.reducers`)
  }
  const reducers = resolveFile(
    resolveConfig.redux.reducers,
    'redux_reducers.js'
  )

  if (checkRuntimeEnv(resolveConfig.redux.middlewares)) {
    throw new Error(`${message.clientEnvError}.redux.middlewares`)
  }
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
