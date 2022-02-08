const adjustResolveConfig = async (resolveConfig) => {
  try {
    const { adjustResolveConfig } = await import(
      `${resolveConfig.runtime.module}/compile-time`
    )
    await adjustResolveConfig(resolveConfig)
  } catch (error) {
    if (
      error?.code !== 'ERR_MODULE_NOT_FOUND' &&
      error?.code !== 'MODULE_NOT_FOUND'
    ) {
      throw error
    }
  }
}

export default adjustResolveConfig
