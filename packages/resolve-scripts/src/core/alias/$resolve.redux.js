import { message } from '../constants'

export default ({ resolveConfig }) => {
  if (!resolveConfig.redux) {
    throw new Error(`${message.configNotContainSectionError}.redux`)
  }

  const exports = []

  exports.push(
    `import store from ${JSON.stringify(resolveConfig.redux.store)}`,
    `import reducers from ${JSON.stringify(resolveConfig.redux.reducers)}`,
    `import middlewares from ${JSON.stringify(
      resolveConfig.redux.middlewares
    )}`,
    ``,
    `export default {`,
    `  store, reducers, middlewares`,
    `}`
  )

  return {
    code: exports.join('\r\n')
  }
}
