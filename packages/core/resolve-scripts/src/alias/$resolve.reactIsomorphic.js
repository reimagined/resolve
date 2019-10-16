import {
  message,
  RUNTIME_ENV_NOWHERE,
  RESOURCE_ANY,
  IMPORT_INSTANCE
} from '../constants'
import importResource from '../import_resource'
import { checkRuntimeEnv } from '../declare_runtime_env'

export default ({ resolveConfig }) => {
  if (resolveConfig.redux == null || resolveConfig.routes == null) {
    throw new Error(`${message.configNotContainSectionError}.redux, routes`)
  }

  const imports = []
  const constants = []
  const exports = []

  if (checkRuntimeEnv(resolveConfig.routes)) {
    throw new Error(`${message.clientEnvError}.routes`)
  }

  importResource({
    resourceName: `routes`,
    resourceValue: resolveConfig.routes,
    runtimeMode: RUNTIME_ENV_NOWHERE,
    importMode: RESOURCE_ANY,
    instanceMode: IMPORT_INSTANCE,
    imports,
    constants
  })

  exports.push(`const redux = {
    reducers: {},
    middlewares: [],
    sagas: [],
    enhancers: []
  }`)

  if (resolveConfig.redux.hasOwnProperty('reducers')) {
    const reducersSection = resolveConfig.redux.reducers

    if (reducersSection == null || reducersSection.constructor !== Object) {
      throw new Error(`${message.configNotContainSectionError}.redux.reducers`)
    }

    for (const [index, reducerName] of Object.entries(
      Object.keys(reducersSection)
    )) {
      constants.push(
        `const reducer_${index}_name = ${JSON.stringify(reducerName)}`
      )

      importResource({
        resourceName: `reducer_${index}`,
        resourceValue: reducersSection[reducerName],
        runtimeMode: RUNTIME_ENV_NOWHERE,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        imports,
        constants
      })

      exports.push(`redux.reducers[reducer_${index}_name] = reducer_${index}`)
    }
  }

  if (resolveConfig.redux.hasOwnProperty('middlewares')) {
    const middlewaresSection = resolveConfig.redux.middlewares
    if (!Array.isArray(middlewaresSection)) {
      throw new Error(
        `${message.configNotContainSectionError}.redux.middlewares`
      )
    }

    for (const [index, middleware] of Object.entries(middlewaresSection)) {
      importResource({
        resourceName: `middleware_${index}`,
        resourceValue: middleware,
        runtimeMode: RUNTIME_ENV_NOWHERE,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        imports,
        constants
      })

      exports.push(`redux.middlewares.push(middleware_${index})`)
    }
  }

  if (resolveConfig.redux.hasOwnProperty('sagas')) {
    const sagasSection = resolveConfig.redux.sagas
    if (!Array.isArray(sagasSection)) {
      throw new Error(`${message.configNotContainSectionError}.redux.sagas`)
    }

    for (const [index, saga] of Object.entries(sagasSection)) {
      importResource({
        resourceName: `saga_${index}`,
        resourceValue: saga,
        runtimeMode: RUNTIME_ENV_NOWHERE,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        imports,
        constants
      })

      exports.push(`redux.sagas.push(saga_${index})`)
    }
  }

  if (resolveConfig.redux.hasOwnProperty('enhancers')) {
    const enhancersSection = resolveConfig.redux.enhancers
    if (!Array.isArray(enhancersSection)) {
      throw new Error(`${message.configNotContainSectionError}.redux.enhancers`)
    }

    for (const [index, enhancer] of Object.entries(enhancersSection)) {
      importResource({
        resourceName: `enhancer_${index}`,
        resourceValue: enhancer,
        runtimeMode: RUNTIME_ENV_NOWHERE,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        imports,
        constants
      })

      exports.push(`redux.enhancers.push(enhancer_${index})`)
    }
  }

  exports.push(`const reactIsomorphic = { redux, routes }`)

  exports.push('export default reactIsomorphic')

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
