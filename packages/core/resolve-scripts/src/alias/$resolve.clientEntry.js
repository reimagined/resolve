import loaderUtils from 'loader-utils'
import {
  RUNTIME_ENV_NOWHERE,
  RESOURCE_INSTANCE_ONLY,
  IMPORT_INSTANCE
} from '../constants'
import importResource from '../import_resource'

export default ({ resolveConfig, isClient }, resourceQuery) => {
  if (!/^\?/.test(resourceQuery)) {
    throw new Error(
      `Resource $resolve.clientEntry should be retrieved with resource query`
    )
  }

  const inputFile = loaderUtils.parseQuery(resourceQuery).inputFile
  const clientEntry = resolveConfig.clientEntries.find(
    entry =>
      `${inputFile}` === (Array.isArray(entry) ? `${entry[0]}` : `${entry}`)
  )

  if (clientEntry == null) {
    throw new Error(`Resource $resolve.clientEntry "${inputFile}" not found`)
  }

  const moduleType = Array.isArray(clientEntry)
    ? clientEntry[1].moduleType
    : 'iife'

  const imports = []
  const constants = []
  const exports = []

  if (isClient) {
    imports.push(`import clientImports from '$resolve.clientImports'`)
    imports.push(`import clientChunk from '$resolve.clientChunk'`)
    imports.push(`import localS3Constants from '$resolve.localS3Constants'`)
    constants.push(`const entryArgs = {
      clientImports,
      localS3Constants,
      ...clientChunk
    }`)
  } else {
    imports.push(`import serverImports from '$resolve.serverImports'`)
    imports.push(`import seedClientEnvs from '$resolve.seedClientEnvs'`)
    imports.push(`import constants from '$resolve.constants'`)
    imports.push(`import eventListeners from '$resolve.eventListeners'`)
    imports.push(`import aggregates from '$resolve.aggregates'`)
    imports.push(`import readModels from '$resolve.readModels'`)
    imports.push(`import viewModels from '$resolve.viewModels'`)
    imports.push(`import sagas from '$resolve.sagas'`)
    imports.push(`import schedulers from '$resolve.schedulers'`)
    imports.push(`import localS3Constants from '$resolve.localS3Constants'`)
    constants.push(`const entryArgs = {
      serverImports,
      seedClientEnvs,
      constants,
      eventListeners,
      aggregates,
      readModels,
      viewModels,
      sagas,
      schedulers,
      localS3Constants
    }`)
  }

  importResource({
    resourceName: `clientEntry`,
    resourceValue: inputFile,
    runtimeMode: RUNTIME_ENV_NOWHERE,
    importMode: RESOURCE_INSTANCE_ONLY,
    instanceMode: IMPORT_INSTANCE,
    imports,
    constants
  })

  if (moduleType === 'iife') {
    exports.push(`clientEntry(entryArgs)`)
  } else {
    exports.push(`const boundClientEntry = clientEntry.bind(null, entryArgs)`)
    exports.push(`export default boundClientEntry`)
  }

  return [...imports, ...constants, ...exports].join('\r\n')
}
