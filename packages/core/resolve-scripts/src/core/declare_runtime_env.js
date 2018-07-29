export const runtimeEnvSymbol = Symbol('@@resolve/runtime_env')

const declareRuntimeEnv = (envName) => Object.create(null, {
  type: { value: runtimeEnvSymbol },
  name: { value: envName }
})

export default declareRuntimeEnv
