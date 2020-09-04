import {
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_ANYWHERE,
  IMPORT_CONSTRUCTOR,
} from '../constants'
import importResource from '../import_resource'

export default ({ resolveConfig, isClient }) => {
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
