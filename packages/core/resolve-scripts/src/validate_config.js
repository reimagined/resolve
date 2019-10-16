import Ajv from 'ajv'
import Trie from 'route-trie'

import { schemaResolveConfig, message } from './constants'
import { checkRuntimeEnv } from './declare_runtime_env'

const ajv = new Ajv()

const allowedMethods = [
  'HEAD',
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'OPTIONS',
  'ALL'
]

export const validateReadModelConnectors = resolveConfig => {
  for (const { connectorName } of [
    ...resolveConfig.readModels,
    ...resolveConfig.sagas
  ]) {
    if (resolveConfig.readModelConnectors[connectorName] == null) {
      throw new Error(
        `The "${connectorName}" read model connector is required but not specified`
      )
    }
  }

  for (const name of Object.keys(resolveConfig.readModelConnectors)) {
    const findResult = [
      ...resolveConfig.readModels,
      ...resolveConfig.sagas
    ].find(({ connectorName }) => connectorName === name)
    if (!findResult) {
      throw new Error(
        `The "${name}" read model connector is specified but no read model/saga uses it`
      )
    }
  }
}

export const validateApiHandlers = resolveConfig => {
  if (!resolveConfig.hasOwnProperty('apiHandlers')) {
    return
  }
  const trie = new Trie()

  for (const [idx, apiHandler] of resolveConfig.apiHandlers.entries()) {
    if (checkRuntimeEnv(apiHandler.path)) {
      throw new Error(`${message.clientEnvError}.apiHandlers[${idx}].path`)
    }
    if (checkRuntimeEnv(apiHandler.method)) {
      throw new Error(`${message.clientEnvError}.apiHandlers[${idx}].method`)
    }

    if (checkRuntimeEnv(apiHandler.controller)) {
      throw new Error(
        `${message.clientEnvError}.apiHandlers[${idx}].controller`
      )
    }

    try {
      trie.define(apiHandler.path)
    } catch (error) {
      throw new Error(
        `Incorrect options.apiHandlers[${idx}].path = "${apiHandler.path}"\nTrie error: ${error}`
      )
    }

    apiHandler.method = apiHandler.method.toUpperCase()

    if (allowedMethods.indexOf(apiHandler.method) < 0) {
      throw new Error(
        [
          `Incorrect options.apiHandlers[${idx}].method = "${apiHandler.path}"``API handler method should be one from following list ${allowedMethods}`
        ].join('\n')
      )
    }
  }
}

const validateUniqueNames = resolveConfig => {
  const uniqueNames = new Set()
  const tag = (key, section) => {
    // eslint-disable-next-line no-new-wrappers
    const result = new String(key)
    result.section = section
    return result
  }

  const sourceNames = [
    ...resolveConfig.aggregates.map(({ name }) => tag(name, 'aggregates')),
    ...resolveConfig.readModels.map(({ name }) => tag(name, 'readModels')),
    ...resolveConfig.viewModels.map(({ name }) => tag(name, 'viewModels')),
    ...resolveConfig.sagas.map(({ name }) => tag(name, 'sagas')),
    ...Object.keys(resolveConfig.schedulers).map(({ name }) =>
      tag(name, 'schedulers')
    )
  ]

  for (const taggedName of sourceNames) {
    const name = String(taggedName)
    if (uniqueNames.has(name)) {
      const sections = sourceNames
        .filter(taggedName => String(taggedName) === name)
        .map(taggedName => taggedName.section)

      throw new Error(`Duplicate name ${name} between sections: ${sections}`)
    }

    uniqueNames.add(name)
  }
}

const validateConfig = config => {
  const linearizedConfig = JSON.parse(JSON.stringify(config))
  const valid = ajv.validate(schemaResolveConfig, linearizedConfig)

  if (!valid) {
    throw new Error(
      'Resolve Config validation failed: ' + JSON.stringify(ajv.errors, null, 2)
    )
  }

  validateUniqueNames(config)
  validateApiHandlers(config)
  validateReadModelConnectors(config)

  return true
}

export default validateConfig
