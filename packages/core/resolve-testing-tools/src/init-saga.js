import { Phases, symbol } from './constants'

const initSaga = async ({ promise, transformEvents }) => {
  if (promise[symbol].phase < Phases.SAGA) {
    throw new TypeError()
  }

  try {
    const result = {
      commands: [],
      scheduleCommands: [],
      sideEffects: [],
      queries: []
    }
    const { adapter, events, handlers, sideEffects, properties } = promise[
      symbol
    ]

    const store = await adapter.connect('TEST-SAGA-READ-MODEL')

    for (const event of transformEvents(events)) {
      const handler = handlers[event.type]

      if (handler === undefined) {
        continue
      }

      if (typeof handler !== 'function') {
        throw new TypeError()
      }

      const isEnabled =
        +properties.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP <= +event.timestamp

      await handler(
        {
          sideEffects: Object.keys(sideEffects).reduce(
            (acc, key) => {
              acc[key] = async (...args) => {
                if (!isEnabled) return
                result.sideEffects.push([key, ...args, properties])
              }
              return acc
            },
            {
              executeCommand: async (...args) => {
                if (!isEnabled) return
                result.commands.push(args)
              },
              scheduleCommand: async (...args) => {
                if (!isEnabled) return
                result.scheduleCommands.push(args)
              },
              executeQuery: async (...args) => {
                if (!isEnabled) return
                result.queries.push(args)
              },
              isEnabled
            }
          ),
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
