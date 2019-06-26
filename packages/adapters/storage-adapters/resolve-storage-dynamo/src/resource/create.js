const create = async (pool, options) => {
  const { createAdapter, setupAutoScaling, resourceMap } = pool

  const dynamoAdapter = createAdapter({
    ...options,
    skipInit: true,
    lazyWaitForCreate: true
  })

  const lazyResource = Object.create(null)
  resourceMap.set(lazyResource, await dynamoAdapter.init())

  if (pool.billingMode === 'PROVISIONED') {
    await setupAutoScaling(pool, options)
  }

  return lazyResource
}

export default create
