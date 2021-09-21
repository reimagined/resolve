import {
  IMPORT_INSTANCE,
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_OPTIONS_ONLY,
} from '../constants'
import { importResource } from '../import-resource'
import { resolveResource } from '../resolve-resource'
import { injectRuntimeEnv } from '../declare_runtime_env'

// TODO: get rid of that entryPointMarker. There is more convenient ways to determine script location

const emitStaticImport = (runtime) => {
  const imports = [
    `import '$resolve.guardOnlyServer'`,
    `import serverAssemblies from '$resolve.serverAssemblies'`,
  ]
  const constants = [``]
  const exports = [``]

  importResource({
    resourceName: `runtime_entry`,
    resourceValue: runtime,
    runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
    importMode: RESOURCE_ANY,
    instanceMode: IMPORT_INSTANCE,
    imports,
    constants,
  })

  constants.push(`const initPromise = runtime_entry(serverAssemblies)`)
  constants.push(`const handler = async (...args) => {`)
  constants.push(`   const worker = await initPromise`)
  constants.push(`   return await worker(...args)`)
  constants.push(`}`)

  exports.push(`export { entryPointMarker } from '@resolve-js/runtime-base'`)
  exports.push(`export default handler`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

const emitDynamicImport = (runtime) => {
  const { result, imported, isPackage } = resolveResource(runtime.module)
  const entry = isPackage ? imported : 'default'
  return `
    import '$resolve.guardOnlyServer'
    export { entryPointMarker, getLog } from '@resolve-js/runtime-base'
    
    const log = getLog('dynamicImportEntry')
    const runtimeOptions = ${injectRuntimeEnv(runtime.options)}

    const handler = async (...args) => {
      console.log(args)
      try {
        if(!global.initPromise) {
          const interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault')
          global.serverAssemblies = interopRequireDefault(
            require('$resolve.serverAssemblies')
          ).default
          
          const entryFactory = interopRequireDefault(
            require('${result}')
          ).${entry} 
          
          global.entry = entryFactory(runtimeOptions)
          global.initPromise = entry(serverAssemblies)
        }
        const worker = await initPromise
        return await worker(...args)
      } catch(error) {
        log.error('Fatal error: ', error)
        throw error
      }
    }
    export default handler
  `
}

const importEntry = ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.entry`)
  }

  const runtime = resolveConfig.runtime

  const code =
    runtime.options && runtime.options.importMode === 'dynamic'
      ? emitDynamicImport(runtime)
      : emitStaticImport(runtime)

  console.log(code)

  return code
}
export default importEntry
