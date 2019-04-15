import { Phases, symbol } from './constants'

const initSaga = async ({ promise, transformEvents }) => {
  if (promise[symbol].phase < Phases.SAGA) {
    throw new TypeError()
  }

  try {
    const result = {
      commands: [],
      scheduleCommands: [],
      sideEffects: []
    }
    const { adapter, events, handlers, sideEffects } = promise[symbol]

    const store = await adapter.connect('TEST-SAGA-READ-MODEL')

    for (const event of transformEvents(events)) {
      const handler = handlers[event.type]
      if (typeof handler !== 'function') {
        throw new TypeError()
      }

      await handler(
        {
          executeCommand: async (...args) => {
            result.commands.push(args)
          },
          scheduleCommand: async (...args) => {
            result.scheduleCommands.push(args)
          },
          sideEffects: Object.keys(sideEffects).reduce((acc, key) => {
            acc[key] = async (...args) => {
              result.sideEffects.push([key, ...args])
            }
            return acc
          }, {}),
          store
        },
        event
      )
    }

    await adapter.disconnect(store, 'TEST-SAGA-READ-MODEL')

    promise[symbol].resolve(result)
  } catch (error) {
    promise[symbol].reject(error)
  }
}

export default initSaga
