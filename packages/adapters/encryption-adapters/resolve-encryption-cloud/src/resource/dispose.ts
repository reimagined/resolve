const dispose = async (pool: any, options: any): Promise<void> => {
  const { destroyResource, createResource } = pool

  await destroyResource(options)
  await createResource(options)
}

export default dispose
