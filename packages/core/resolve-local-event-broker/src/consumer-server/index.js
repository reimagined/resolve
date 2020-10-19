import { createServer } from 'resolve-local-rpc'

const createAndInitConsumer = async (config) => {
  const { baseResolve, initResolve, disposeResolve, address } = config

  const consumerMethod = async (key, ...args) => {
    const currentResolve = Object.create(baseResolve)
    try {
      await initResolve(currentResolve)
      const result = await currentResolve.eventBusConsumer[key](...args)
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
