import { Phases, symbol } from './constants'

const defaultMockError = `Using default mock result: override "executeCommand", "executeQuery" and "scheduleCommand" in "sideEffects" section with custom mocks`

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
    const {
      name,
      adapter,
      events,
      handlers,
      sideEffects,
      properties
    } = promise[symbol]

    const store = await adapter.connect(name)

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
                if (isEnabled) {
                  result.sideEffects.push([key, ...args, properties])
                  return await sideEffects[key](...args)
                }
              }
              return acc
            },
            {
              executeCommand: async (...args) => {
                if (isEnabled) {
                  result.commands.push(args)
                  // eslint-disable-next-line no-console
                  console.warn(defaultMockError)
                }
              },
              scheduleCommand: async (...args) => {
                if (isEnabled) {
                  result.scheduleCommands.push(args)
                  // eslint-disable-next-line no-console
                  console.warn(defaultMockError)
                }
              },
              executeQuery: async (...args) => {
                if (isEnabled) {
                  result.queries.push(args)
                  // eslint-disable-next-line no-console
                  console.warn(defaultMockError)
                }
              },
              isEnabled
            }
          ),
          store
        },
        event
      )
    }

    await adapter.disconnect(store, name)

    promise[symbol].resolve(result)
  } catch (error) {
    promise[symbol].reject(error)
  }
}

export default initSaga
