import path from 'path'

const isNotFound = (error) =>
  error?.code === 'ERR_MODULE_NOT_FOUND' || error?.code === 'MODULE_NOT_FOUND'

const adjustResolveConfig = async (resolveConfig) => {
  let adjustResolveConfigPath

  try {
    adjustResolveConfigPath = require.resolve(
      `${resolveConfig.runtime.module}/compile-time`
    )
  } catch (error) {
    if (!isNotFound(error)) {
      throw error
    }
    adjustResolveConfigPath = require.resolve(
      path.resolve(
        process.cwd(),
        `${resolveConfig.runtime.module}/compile-time`
      )
    )
  }

  const { adjustResolveConfig } = await import(adjustResolveConfigPath)
  await adjustResolveConfig(resolveConfig)
}

export default adjustResolveConfig
