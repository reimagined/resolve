import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_OPTIONS_ONLY,
  IMPORT_CONSTRUCTOR,
} from '../constants'
import { importResource } from '../import-resource'

const importClientImports = ({ resolveConfig, isClient }) => {
  if (!isClient) {
    throw new Error(`${message.clientAliasInServerCodeError}.clientImports`)
  }

  if (resolveConfig.clientImports == null) {
    throw new Error(`${message.configNotContainSectionError}.clientImports`)
  }

  const imports = [``]
  const constants = [``]
  const exports = [``, `const imports = {}`, ``]

  const importKeys = Object.keys(resolveConfig.clientImports)
  for (let index = 0; index < importKeys.length; index++) {
    const importKey = importKeys[index]
    const importValue = resolveConfig.clientImports[importKey]

    importResource({
      resourceName: `import_${index}`,
      resourceValue: importValue,
      runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_CONSTRUCTOR,
      injectRuntimeOptions: true,
      imports,
      constants,
    })

    exports.push(`imports[${JSON.stringify(importKey)}] =  import_${index}`)
  }

  exports.push(`export default imports`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importClientImports
