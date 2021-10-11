import loaderUtils from 'loader-utils'
import path from 'path'

import { resolveResource } from '../resolve-resource'
import { message, OPTIONAL_ASSET_ERROR } from '../constants'

const importReadModelProcedure = (
  { resolveConfig, isClient },
  resourceQuery
) => {
  if (!/^\?/.test(resourceQuery)) {
    throw new Error(
      `Resource $resolve.readModelProcedure should be retrieved with resource query`
    )
  }
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.readModelProcedure`
    )
  }

  const { readModelName } = loaderUtils.parseQuery(resourceQuery)
  const readModel = resolveConfig.readModels.find(
    ({ name }) => name === readModelName
  )
  const readModelConnector =
    readModel != null
      ? resolveConfig.readModelConnectors[readModel.connectorName]
      : null
  let wrapProcedureMethodPath = null
  for (const pathPostfix of [
    ['es', 'wrap-procedure'],
    ['lib', 'wrap-procedure'],
    ['wrap-procedure'],
  ]) {
    try {
      const { result } = resolveResource(
        path.join(readModelConnector.module, ...pathPostfix)
      )
      wrapProcedureMethodPath = result
    } catch (e) {}
    if (wrapProcedureMethodPath != null) {
      break
    }
  }
  if (wrapProcedureMethodPath == null) {
    throw new Error(OPTIONAL_ASSET_ERROR)
  }

  const imports = [
    `import { SynchronousPromise } from 'synchronous-promise'`,
    `import currentReadModel from '$resolve.readModel?readModelName=${readModelName}&onlyProjection=true'`,
    `import wrapProcedure from ${JSON.stringify(wrapProcedureMethodPath)}`,
  ]
  const constants = [
    `SynchronousPromise.installGlobally()`,
    `const procedure = wrapProcedure(currentReadModel)`,
  ]
  const exports = [`export default procedure`]

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importReadModelProcedure
