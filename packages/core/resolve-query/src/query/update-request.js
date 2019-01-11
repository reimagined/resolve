const updateRequest = async (pool, readModelName, readOptions) => {
  const executor = pool.getExecutor(pool, readModelName)
  if (!pool.hasOwnProperty('activeDemandSet')) {
    pool.activeDemandSet = new Set()
  }

  Promise.resolve()
    .then(() => executor.read(readOptions))
    .catch(error => error)
    .then(() => executor.updateByEvents([]))
    .catch(error => {
      // eslint-disable-next-line no-console
      console.warn('Error while updating read model', error)
    })

  if (!pool.activeDemandSet.has(readModelName)) {
    // Delay initial read-model on-demand request to enforce awaiting tables creation in common
    // cases for better usability, but will be evenntually consistent anyway, even no timeout
    await new Promise(resolve => setTimeout(resolve, 2000))
    pool.activeDemandSet.add(readModelName)
  }
}

export default updateRequest
