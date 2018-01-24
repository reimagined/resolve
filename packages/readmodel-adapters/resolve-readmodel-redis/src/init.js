import createNativeAdapter from './adapter'
import storeInterface from './storeInterface'
import messages from './messages'

const initProjection = async repository => {
  await repository.connectionPromise
  if (repository.lastTimestamp !== 0) return
  repository.lastTimestamp = 1

  try {
    await repository.initHandler(repository.writeInterface)
  } catch (error) {
    repository.internalError = error
  }
}

const synchronizeDatabase = async (repository, client) => {
  repository.lastTimestamp = Math.max(
    repository.lastTimestamp,
    await repository.meta.getLastTimestamp()
  )
}

const init = repository => {
  if (repository.interfaceMap) {
    throw new Error(messages.alreadyInitialized)
  }
  repository.lastTimestamp = 0

  if (typeof repository.initHandler !== 'function') {
    repository.initHandler = async () => {}
  }

  repository.connectionPromise = repository
    .connectDatabase()
    .then(client => (repository.client = client))
    .then(async () => {
      repository.nativeAdapter = await createNativeAdapter(repository)
    })
    .then(synchronizeDatabase.bind(null, repository))

  repository.internalError = null

  repository.readInterface = storeInterface(repository, false)
  repository.writeInterface = storeInterface(repository, true)

  repository.initDonePromise = initProjection(repository)

  return {
    getLastAppliedTimestamp: async () => {
      await repository.connectionPromise
      return repository.lastTimestamp
    },
    getReadable: async () => {
      await repository.initDonePromise
      return repository.readInterface
    },
    getError: async () => {
      await repository.initDonePromise
      return repository.internalError
    }
  }
}

export default init
