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

const emitStaticImport = async (runtime) => {
  const imports = [
    `import '$resolve.guardOnlyServer'`,
    `import serverAssemblies from '$resolve.serverAssemblies'`,
    `import { getLog } from '@resolve-js/runtime-base'`,
  ]
  const constants = [``]
  const exports = [``]

  importResource({
    resourceName: `runtimeEntry`,
    resourceValue: runtime,
    runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
    importMode: RESOURCE_ANY,
    instanceMode: IMPORT_INSTANCE,
    imports,
    constants,
  })

  constants.push(`
    const { entry, execMode } = runtimeEntry
    let worker
    entry(serverAssemblies).then((w) => {
      worker = w
      if (execMode === 'immediate') {
        worker().catch((error) => getLog('backedStaticImportEntry').error(error))
      }
    })
  `)

  exports.push(`export { entryPointMarker } from '@resolve-js/runtime-base'`)
  exports.push(`export default worker`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

const emitDynamicImport = async (runtime) => {
  const { result, imported, isPackage } = resolveResource(runtime.module)
  const moduleImport = isPackage ? imported : 'default'

  // eslint-disable-next-line no-undef
  const runtimeModule = await import(result)
  console.log(runtimeModule)
  const { execMode } = await runtimeModule[moduleImport]()
  console.log(execMode)

  return `
    import '$resolve.guardOnlyServer'
    import { getLog, entryPointMarker } from '@resolve-js/runtime-base'
    
    const log = getLog('backendDynamicImportEntry')
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
          ).${moduleImport} 
          
          const { entry } = entryFactory(runtimeOptions)
          
          global.entry = entry
          global.initPromise = entry(serverAssemblies)
        }
        const worker = await initPromise
        return await worker(...args)
      } catch(error) {
        log.error('Fatal error: ', error)
        throw error
      }
    }
    ${
      execMode === 'immediate'
        ? 'handler().catch((error) => log.error(error))'
        : ''
    }
    export { entryPointMarker }
    export default handler
  `
}

const importEntry = async ({ resolveConfig, isClient }) => {
  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.entry`)
  }

  const runtime = resolveConfig.runtime

  const code =
    runtime.options && runtime.options.importMode === 'dynamic'
      ? await emitDynamicImport(runtime)
      : await emitStaticImport(runtime)

  console.log(code)

  return code
}
export default importEntry
