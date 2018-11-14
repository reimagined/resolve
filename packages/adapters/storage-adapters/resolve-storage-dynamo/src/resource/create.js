const create = async (pool, options) => {
  const { createAdapter, setupAutoScaling } = pool

  const dynamoAdapter = createAdapter({
    ...options,
    skipInit: true
  })
  await dynamoAdapter.init()

  await setupAutoScaling(pool, options)
}

export default create
