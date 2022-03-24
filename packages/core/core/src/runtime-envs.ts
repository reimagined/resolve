export const runtimeEnvSymbol = Symbol('@@resolve/runtime_env')

export type RuntimeEnv = String & { type?: any; defaultValue?: any }

export const declareRuntimeEnv = (envName: string, defaultValue?: any) => {
  if (envName == null || envName.constructor !== String) {
    throw new Error('Runtime environment variable must be a string')
  }
  if (defaultValue != null && defaultValue.constructor !== String) {
    throw new Error('Default value must be a string or be absent')
  }

  // eslint-disable-next-line no-new-wrappers
  const envContainer: RuntimeEnv = new String(envName)
  envContainer.type = runtimeEnvSymbol
  envContainer.defaultValue = defaultValue != null ? defaultValue : null

  return envContainer
}

export const checkRuntimeEnv = (value: any): value is RuntimeEnv =>
  value?.constructor === String && (value as any)?.type === runtimeEnvSymbol
