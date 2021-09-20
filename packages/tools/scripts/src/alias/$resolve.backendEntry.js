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
    export { entryPointMarker } from '@resolve-js/runtime-base'
    
    const runtimeOptions = ${injectRuntimeEnv(runtime.options)}
    
    console.log('dynamic entry point')
    console.log(runtimeOptions)

    const handler = async (...args) => {
      console.log(args)
      try {
        if(!global.initPromise) {
        console.log('no promise, initializing')
          const interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault')
          console.log('server assemblies')
          global.serverAssemblies = interopRequireDefault(
            require('$resolve.serverAssemblies')
          ).default
          
          console.log('entry factory')
          const entryFactory = interopRequireDefault(
            require('${result}')
          ).${entry} 
          
          console.log('invoking factory')
          global.entry = entryFactory(runtimeOptions)
          console.log('invoking entry') 
          global.initPromise = entry(serverAssemblies)
          console.log('configured')
        }
        const worker = await initPromise
        console.log(worker)
        return await worker(...args)
      } catch(error) {
        console.error('Fatal error: ', error)
        throw error
      }
    }
    console.log('returning handler')

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
