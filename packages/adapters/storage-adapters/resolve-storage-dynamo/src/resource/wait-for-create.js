const waitForCreate = (pool, lazyResource) => {
  const { resourceMap } = pool

  if (!resourceMap.has(lazyResource)) {
    throw new Error('Invalid arguments')
  }

  return resourceMap.get(lazyResource)()
}

export default waitForCreate
