const runtimeEnvSymbol = Symbol('@@resolve/runtime_env')

const declareRuntimeEnv = (envName) => {
  if(envName == null || envName.constructor !== String) {
    throw new Error('Runtime environment variable should be an string')
  }
  
  const envContainer = new String(envName)
  envContainer.type = runtimeEnvSymbol
  
  return envContainer
}

export const checkRuntimeEnv = (value) => {
  if(value == null || value.type !== runtimeEnvSymbol) {
    return null
  }
  
  return value
}

export default declareRuntimeEnv
