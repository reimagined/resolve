import { createServer } from '@reimagined/local-rpc'

const getProvider = (host, key) => {
  switch (key) {
    case 'BeginXATransaction':
    case 'CommitXATransaction':
    case 'RollbackXATransaction':
    case 'Drop':
    case 'SendEvents':
      return host.eventListener
    case 'LoadEvents':
    case 'SaveEvent':
      return host.eventStore
    default: {
      throw new Error(`Invalid key ${key}`)
    }
  }
}

const createAndInitConsumer = async (config) => {
  const { baseResolve, initResolve, disposeResolve, address } = config

  const consumerMethod = async (key, ...args) => {
    const currentResolve = Object.create(baseResolve)
    try {
      await initResolve(currentResolve)
      const provider = getProvider(currentResolve, key)
      const result = await provider[key](...args)
      return result
    } finally {
      await disposeResolve(currentResolve)
    }
  }

  const consumer = new Proxy(
    {},
    {
      get(_, key) {
        return consumerMethod.bind(null, key)
      },
      set() {
        throw new Error(`Consumer API is immutable`)
      },
    }
  )

  return await createServer({
    hostObject: consumer,
    address,
  })
}

export default createAndInitConsumer
