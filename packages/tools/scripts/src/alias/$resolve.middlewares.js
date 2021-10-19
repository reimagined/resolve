import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_OPTIONS_ONLY,
  IMPORT_INSTANCE,
} from '../constants'
import { importResource } from '../import-resource'

const importMiddlewares = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.middlewares`
    )
  }

  const imports = [`import '$resolve.guardOnlyServer'`]
  const constants = []
  const exports = [
    ``,
    `const middlewares = { command: [], resolver: [], projection: [] }`,
    ``,
  ]

  const {
    aggregate: commandMiddlewares = [],
    readModel: {
      resolver: resolverMiddlewares = [],
      projection: projectionMiddlewares = [],
    } = {},
  } = resolveConfig.middlewares ?? {}

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
  for (let index = 0; index < resolverMiddlewares.length; index++) {
    importResource({
      resourceName: `resolver_middlewares_${index}`,
      resourceValue: resolverMiddlewares[index],
      runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      imports,
      constants,
    })

    exports.push(`middlewares.resolver.push(resolver_middlewares_${index})`)
  }
  for (let index = 0; index < projectionMiddlewares.length; index++) {
    importResource({
      resourceName: `projection_middlewares_${index}`,
      resourceValue: projectionMiddlewares[index],
      runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      imports,
      constants,
    })

    exports.push(`middlewares.projection.push(projection_middlewares_${index})`)
  }

  exports.push(`export default middlewares`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importMiddlewares
