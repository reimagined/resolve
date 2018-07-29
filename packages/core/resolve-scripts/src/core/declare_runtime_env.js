const runtimeEnvSymbol = Symbol('@@resolve/runtime_env')

const declareRuntimeEnv = (envName) => {
  if(envName == null || envName.constructor !== String) {
    throw new Error('Runtime environment variable should be an string')
  }
  
  return Object.create(null, {
    type: { value: runtimeEnvSymbol },
    name: { value: envName }
  })
}

export const checkRuntimeEnv = (value) => {
  if(value == null || value.type !== runtimeEnvSymbol) {
    return null
  }
  
  return value.name
}

export default declareRuntimeEnv
