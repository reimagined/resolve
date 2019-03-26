const disposeResolve = async resolve => {
  await resolve.eventStore.dispose()
  await resolve.executeCommand.dispose()
  await resolve.executeQuery.dispose()

  await resolve.storageAdapter.dispose()
  await resolve.snapshotAdapter.dispose()

  for (const name of Object.keys(resolve.readModelConnectors)) {
    await resolve.readModelConnectors[name].dispose()
  }
}

export default disposeResolve
