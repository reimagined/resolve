import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_OPTIONS_ONLY,
  IMPORT_INSTANCE,
} from '../constants'
import importResource from '../import_resource'

const importMiddlewares = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.middlewares`
    )
  }

  const imports = [`import '$resolve.guardOnlyServer'`]
  const constants = []
  const exports = [``, `const middlewares = { command: [], query: [] }`, ``]

  const { command: commandMiddlewares = [], query: queryMiddlewares = [] } =
    resolveConfig.middlewares ?? {}

  for (let index = 0; index < commandMiddlewares.length; index++) {
    importResource({
      resourceName: `command_middlewares_${index}`,
      resourceValue: commandMiddlewares[index],
      runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      imports,
      constants,
    })

    exports.push(`middlewares.command.push(command_middlewares_${index})`)
  }
  for (let index = 0; index < queryMiddlewares.length; index++) {
    importResource({
      resourceName: `query_middlewares_${index}`,
      resourceValue: queryMiddlewares[index],
      runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      imports,
      constants,
    })

    exports.push(`middlewares.query.push(query_middlewares_${index})`)
  }

  exports.push(`export default middlewares`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importMiddlewares
