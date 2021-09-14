import {
  message,
  RUNTIME_ENV_NOWHERE,
  RESOURCE_ANY,
  RUNTIME_ENV_OPTIONS_ONLY,
  IMPORT_INSTANCE,
} from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'
import { importResource } from '../import-resource'

const importViewModels = ({ resolveConfig, isClient }) => {
  const imports = []
  const constants = []
  const exports = [`const viewModels = []`, ``]

  for (let index = 0; index < resolveConfig.viewModels.length; index++) {
    const viewModel = resolveConfig.viewModels[index]

    if (checkRuntimeEnv(viewModel.name)) {
      throw new Error(`${message.clientEnvError}.viewModels[${index}].name`)
    }
    constants.push(`const name_${index} = ${JSON.stringify(viewModel.name)}`)

    importResource({
      resourceName: `projection_${index}`,
      resourceValue: viewModel.projection,
      runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      calculateHash: !isClient ? 'resolve-view-model-projection-hash' : null,
      injectRuntimeOptions: isClient ? true : null,
      imports,
      constants,
    })

    importResource({
      resourceName: `deserializeState_${index}`,
      resourceValue: viewModel.deserializeState,
      runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
      importMode: RESOURCE_ANY,
      instanceMode: IMPORT_INSTANCE,
      instanceFallback: {
        package: '@resolve-js/core',
        import: 'jsonDeserializeState',
      },
      injectRuntimeOptions: isClient ? true : null,
      imports,
      constants,
    })

    exports.push(
      `viewModels.push({`,
      `  name: name_${index}`,
      `, projection: projection_${index}`,
      `, deserializeState: deserializeState_${index}`
    )

    if (!isClient) {
      exports.push(`, invariantHash: projection_${index}_hash`)

      importResource({
        resourceName: `serializeState_${index}`,
        resourceValue: viewModel.serializeState,
        runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        instanceFallback: {
          package: '@resolve-js/core',
          import: 'jsonSerializeState',
        },
        imports,
        constants,
      })

      exports.push(`, serializeState: serializeState_${index}`)

      importResource({
        resourceName: `resolver_${index}`,
        resourceValue: viewModel.resolver,
        runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        instanceFallback: {
          package: '@resolve-js/runtime',
          import: 'defaultViewModelResolver',
        },
        imports,
        constants,
      })

      exports.push(`, resolver: resolver_${index}`)

      importResource({
        resourceName: `encryption_${index}`,
        resourceValue: viewModel.encryption,
        runtimeMode: RUNTIME_ENV_NOWHERE,
        importMode: RESOURCE_ANY,
        instanceMode: IMPORT_INSTANCE,
        instanceFallback: {
          package: '@resolve-js/runtime',
          import: 'disabledEncryption',
        },
        imports,
        constants,
      })

      exports.push(`, encryption: encryption_${index}`)
    }

    exports.push(`})`, ``)
  }

  if (!isClient) {
    exports.push(`
      let AsyncGeneratorFunction = {}
      let GeneratorFunction = {}
      let AsyncFunction = {}

      try {
        eval('AsyncGeneratorFunction = (async function* name(){}).constructor')
      } catch(err) {}

      try {
        eval('GeneratorFunction = (function*(){}).constructor')
      } catch(err) {}

      try {
        eval('AsyncFunction = (async function(){}).constructor')
      } catch(err) {}

      const checkValidProjectionFunction = (func) => {
        if(typeof func !== 'function') {
          return false
        }
        if(func.constructor === GeneratorFunction) {
          return false
        }
        if(func.constructor === AsyncFunction) {
          return false
        }
        if(func.constructor === AsyncGeneratorFunction) {
          return false
        }
        return true
      }
    
      for(const { projection } of viewModels) {
        for(const key of Object.keys(projection)) {
          if(!checkValidProjectionFunction(projection[key])) {
            throw new Error(
              \`A Projection handler "\${key}" cannot be a generator or/and asynchronous function\`
            )
          }
        }
      }
    `)
  }

  exports.push(`export default viewModels`)

  return [...imports, ...constants, ...exports].join('\r\n')
}

export default importViewModels
