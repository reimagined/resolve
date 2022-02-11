type ResolveConfig = any

export const adjustResolveConfig = async (resolveConfig: ResolveConfig) => {
  resolveConfig.target = 'local'
}
