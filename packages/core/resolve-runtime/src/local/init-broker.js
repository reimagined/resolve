import initResolve from '../common/init-resolve'
import disposeResolve from '../common/dispose-resolve'
import multiplexAsync from '../common/utils/multiplex-async'

const initBroker = async (resolve) => {
  const invokeEventSubscriberAsync = multiplexAsync.bind(
    null,
    async (eventSubscriber, method, parameters) => {
      const currentResolve = Object.create(resolve)
      try {
        await initResolve(currentResolve)
        const rawMethod = currentResolve.eventSubscriber[method]
        if (typeof rawMethod !== 'function') {
          throw new TypeError(method)
        }

        const result = await rawMethod.call(currentResolve.eventSubscriber, {
          eventSubscriber,
          ...parameters,
        })

        return result
      } finally {
        await disposeResolve(currentResolve)
      }
    }
  )

  Object.assign(resolve, {
    invokeEventSubscriberAsync,
  })
}

export default initBroker
