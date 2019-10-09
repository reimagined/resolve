const dispose = async (pool, options) => {
  const { destroyResource, createResource } = pool

  await destroyResource(options)
  await createResource(options)
}

export default dispose
