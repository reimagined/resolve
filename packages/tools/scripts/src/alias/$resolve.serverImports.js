import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_CONSTRUCTOR,
} from '../constants'
import { importResource } from '../import-resource'

const importServerImports = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCode}.serverImports`)
  }

  if (resolveConfig.serverImports == null) {
    throw new Error(`${message.configNotContainSectionError}.serverImports`)
  }

  const imports = [`import '$resolve.guardOnlyServer'`]
  const constants = [``]
  const exports = [``, `const imports = {}`, ``]

  const importKeys = Object.keys(resolveConfig.serverImports)
  for (let index = 0; index < importKeys.length; index++) {
    const importKey = importKeys[index]
    const importValue = resolveConfig.serverImports[importKey]

    importResource({
      resourceName: `import_${index}`,
      resourceValue: importValue,
      runtimeMode: RUNTIME_ENV_ANYWHERE,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_CONSTRUCTOR,
      imports,
      constants,
    })

    exports.push(`imports[${JSON.stringify(importKey)}] =  import_${index}`)
  }

  exports.push(`export default imports`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importServerImports
