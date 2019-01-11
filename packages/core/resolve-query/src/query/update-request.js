const updateRequest = async (pool, readModelName) => {
  const executor = pool.getExecutor(pool, readModelName)

  Promise.resolve()
    .then(executor.read.bind(null, { isBulkRead: true }))
    .then(executor.updateByEvents.bind(null, []))
    .catch(error => {
      // eslint-disable-next-line no-console
      console.warn('Error while updating read model', error)
    })
}

export default updateRequest
