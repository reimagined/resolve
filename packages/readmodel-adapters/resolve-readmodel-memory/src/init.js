import 'regenerator-runtime/runtime'

import messages from './messages'

function getStoreInterface(repository, isWriteable) {
  const storeIface = {
    hget: async (key, field) => {
      if (!repository.storagesMap.has(key)) {
        if (!isWriteable) {
          return null
        }

        repository.storagesMap.set(key, repository.constructStorage())
      }

      const map = repository.storagesMap.get(key)
      if (map.has(field)) {
        return map.get(field)
      }

      return null
    },

    hset: async key => {
      throw new Error(messages.readSideForbiddenOperation('hset', key))
    },

    del: async key => {
      throw new Error(messages.readSideForbiddenOperation('del', key))
    }
  }

  if (isWriteable) {
    storeIface.hset = async (key, field, value) => {
      if (!repository.storagesMap.has(key)) {
        repository.storagesMap.set(key, repository.constructStorage())
      }

      const map = repository.storagesMap.get(key)
      if (value === null || value === undefined) {
        map.delete(field)
        return
      }

      map.set(field, value)
    }

    storeIface.del = async key => {
      repository.storagesMap.delete(key)
    }
  }

  return Object.freeze(storeIface)
}

async function initProjection(repository) {
  try {
    await repository.initHandler(repository.writeInterface)
  } catch (error) {
    repository.internalError = error
  }
}

export default function init(repository) {
  if (repository.initDonePromise) {
    throw new Error(messages.reinitialization)
  }
  if (typeof repository.initHandler !== 'function') {
    repository.initHandler = async () => {}
  }

  repository.storagesMap = new Map()
  repository.internalError = null

  repository.readInterface = getStoreInterface(repository, false)
  repository.writeInterface = getStoreInterface(repository, true)

  repository.initDonePromise = initProjection(repository)

  return {
    getLastAppliedTimestamp: async () => 0,

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
