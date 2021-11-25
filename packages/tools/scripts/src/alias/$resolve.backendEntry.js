import {
  IMPORT_INSTANCE,
  message,
  RESOURCE_ANY,
  RUNTIME_ENV_OPTIONS_ONLY,
} from '../constants'
import { importResource } from '../import-resource'
import { resolveResource } from '../resolve-resource'
import { injectRuntimeEnv } from '../declare_runtime_env'
import { getLog } from '../get-log'

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
    const log = getLog('backendStaticImport')
    const { entry, execMode } = runtimeEntry
    let worker
    entry(serverAssemblies).then((w) => {
      worker = w
      if (execMode === 'immediate') {
        log.debug('"execMode" set to "immediate", executing worker')
        worker().catch((error) => log.error(error))
        log.debug('worker now running')
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

  return `
    import '$resolve.guardOnlyServer'
    import { getLog, entryPointMarker } from '@resolve-js/runtime-base'
    
    const log = getLog('backendDynamicImportEntry')
    const runtimeOptions = ${injectRuntimeEnv(runtime.options)}

    const handler = async (...args) => {
      try {
        await immediatePromise
        if(!global.initPromise) {
          const interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault')
          global.serverAssemblies = interopRequireDefault(
            require('$resolve.serverAssemblies')
          ).default
          
          const entryFactory = interopRequireDefault(
            require(${JSON.stringify(result)})
          )[${JSON.stringify(moduleImport)}] 
          
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

    const immediatePromise = (async () => {
      try {
        await Promise.resolve()
        const runtimeModule = require(${JSON.stringify(result)})
        const { execMode } = await runtimeModule[${JSON.stringify(
          moduleImport
        )}]()
        if(execMode === 'immediate') {
          log.debug('"execMode" set to "immediate", executing worker') 
          handler().catch((error) => log.error(error))
        }
      } catch(error) {
        log.error('Fatal error: ', error)
      }
    })()

    export { entryPointMarker }
    export default handler
  `
}

const importEntry = async ({ resolveConfig, isClient }) => {
  const log = getLog(`$resolve.backendEntry`)

  if (isClient) {
    throw new Error(`${message.serverAliasInClientCodeError}$resolve.entry`)
  }

  const runtime = resolveConfig.runtime

  const code =
    runtime.options && runtime.options.importMode === 'dynamic'
      ? await emitDynamicImport(runtime)
      : await emitStaticImport(runtime)

  log.verbose(`Runtime import generated code:`)
  log.verbose(code)

  return code
}
export default importEntry
