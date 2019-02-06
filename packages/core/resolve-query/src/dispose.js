const dispose = pool => {
  if (pool.disposePromise == null) {
    pool.disposePromise = (async () => {
      for (const executor of pool.executors.values()) {
        await executor.dispose()
      }

      pool.executorTypes.clear()
      pool.executors.clear()
    })()
  }

  return pool.disposePromise
}

export default dispose
