import { createServer } from 'resolve-local-rpc'

const EVENT_LISTENER_PROVIDER = 'eventLisneter'
const EVENTSTORE_PROVIDER = 'eventstoreAdapter'

const PROVIDER_MAP = new Map([
  ['loadEvents', EVENTSTORE_PROVIDER],
  ['saveEvent', EVENTSTORE_PROVIDER],
  ['beginXATransaction', EVENT_LISTENER_PROVIDER],
  ['commitXATransaction', EVENT_LISTENER_PROVIDER],
  ['rollbackXATransaction', EVENT_LISTENER_PROVIDER],
  ['drop', EVENT_LISTENER_PROVIDER],
  ['sendEvents', EVENT_LISTENER_PROVIDER]
])

const createAndInitConsumer = async config => {
  const { baseResolve, initResolve, disposeResolve, address } = config

  const consumerMethod = async (provider, key, ...args) => {
    const currentResolve = Object.create(baseResolve)
    try {
      await initResolve(currentResolve)
      const result = await currentResolve[provider][key](...args)
      return result
    } finally {
      await disposeResolve(currentResolve)
    }
  }
  
  const consumer = new Proxy({}, {
    get(_, key) {
      if(!PROVIDER_MAP.has(key)) {
        throw new Error(`Invalid consumer method ${key}`)
      }
      return consumerMethod.bind(null, PROVIDER_MAP.get(key), key)
    },
    set() {
      throw new Error(`Consumer API is immutable`)
    }
  })

  return await createServer({
    hostObject: consumer,
    address
  })
}

export default createAndInitConsumer
