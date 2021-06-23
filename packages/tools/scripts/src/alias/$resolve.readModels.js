import { message } from '../constants'

const importReadModels = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(
      `${message.serverAliasInClientCodeError}$resolve.readModels`
    )
  }

  const imports = [`import '$resolve.guardOnlyServer'`]
  const constants = [`const readModels = []`]
  const exports = []

  for (let index = 0; index < resolveConfig.readModels.length; index++) {
    const readModelName = resolveConfig.readModels[index].name
    imports.push(
      `import readModel_${index} from "$resolve.readModel?readModelName=${readModelName}"`
    )
    constants.push(`readModels.push(readModel_${index})`)
  }

  exports.push(`export default readModels`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importReadModels
