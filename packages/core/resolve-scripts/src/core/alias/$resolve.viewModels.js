import {
  message,
  RUNTIME_ENV_NOWHERE,
  RESOURCE_ANY,
  RUNTIME_ENV_OPTIONS_ONLY,
  RESOURCE_CONSTRUCTOR_ONLY,
  RUNTIME_ENV_ANYWHERE
} from '../constants'
import { checkRuntimeEnv } from '../declare_runtime_env'
import importResource from '../import_resource'

export default ({ resolveConfig, isClient }) => {
  if (!resolveConfig.viewModels) {
    throw new Error(`${message.configNotContainSectionError}.viewModels`)
  }

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
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      calculateHash: !isClient ? 'resolve-view-model-projection-hash' : null,
      imports,
      constants
    })

    importResource({
      resourceName: `deserializeState_${index}`,
      resourceValue: viewModel.deserializeState,
      runtimeMode: RUNTIME_ENV_NOWHERE,
      importMode: RESOURCE_ANY,
      instanceFallback: 'view_model_deserialize_state.js',
      imports,
      constants
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
        instanceFallback: 'view_model_serialize_state.js',
        imports,
        constants
      })

      exports.push(`, serializeState: serializeState_${index}`)

      importResource({
        resourceName: `validator_${index}`,
        resourceValue: viewModel.validator,
        runtimeMode: RUNTIME_ENV_OPTIONS_ONLY,
        importMode: RESOURCE_ANY,
        instanceFallback: 'view_model_validator.js',
        imports,
        constants
      })

      exports.push(`, validator: validator_${index}`)

      if (viewModel.snapshotAdapter) {
        importResource({
          resourceName: `snapshotAdapter_${index}`,
          resourceValue: viewModel.snapshotAdapter,
          runtimeMode: RUNTIME_ENV_ANYWHERE,
          importMode: RESOURCE_CONSTRUCTOR_ONLY,
          imports,
          constants
        })

        exports.push(`, snapshotAdapter: snapshotAdapter_${index}`)
      }
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

  return {
    code: [...imports, ...constants, ...exports].join('\r\n')
  }
}
