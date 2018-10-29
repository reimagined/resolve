const dispose = repository => {
  if (repository.disposePromise == null) {
    repository.disposePromise = (async () => {
      for (const executor of repository.executors.values()) {
        await executor.dispose()
      }

      repository.executorTypes.clear()
      repository.executors.clear()
    })()
  }

  return repository.disposePromise
}

export default dispose
