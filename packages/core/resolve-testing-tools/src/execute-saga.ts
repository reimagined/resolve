import { Phases, symbol } from './constants'

const defaultMockError = `Using default mock result: override "executeCommand", "executeQuery" and "scheduleCommand" in "sideEffects" section with custom mocks`

export const executeSaga = async ({
  promise,
  transformEvents,
}: {
  promise: any
  transformEvents: Function
}): Promise<any> => {
  if (promise[symbol].phase < Phases.SAGA) {
    throw new TypeError()
  }

  try {
    const result: {
      commands: any[]
      scheduleCommands: any[]
      sideEffects: any[]
      queries: any[]
    } = {
      commands: [],
      scheduleCommands: [],
      sideEffects: [],
      queries: [],
    }
    const {
      name,
      adapter,
      events,
      handlers,
      sideEffects,
      properties,
    } = promise[symbol]

    const store = await adapter.connect(name)

    for (const event of [{ type: 'Init' }, ...transformEvents(events)]) {
      const handler = handlers[event.type]

      if (handler === undefined) {
        continue
      }

      if (typeof handler !== 'function') {
        throw new TypeError()
      }

      const isEnabled =
        +properties.RESOLVE_SIDE_EFFECTS_START_TIMESTAMP <= +event.timestamp

      const accumulator: {
        [key: string]: any
      } = {
        executeCommand: async (...args: any[]) => {
          if (isEnabled) {
            result.commands.push(args)
            // eslint-disable-next-line no-console
            console.warn(defaultMockError)
          }
        },
        scheduleCommand: async (...args: any[]) => {
          if (isEnabled) {
            result.scheduleCommands.push(args)
            // eslint-disable-next-line no-console
            console.warn(defaultMockError)
          }
        },
        executeQuery: async (...args: any[]) => {
          if (isEnabled) {
            result.queries.push(args)
            // eslint-disable-next-line no-console
            console.warn(defaultMockError)
          }
        },
        isEnabled,
      }

      await handler(
        {
          sideEffects: Object.keys(sideEffects).reduce((acc, key) => {
            acc[key] = (...args: any[]): any => {
              if (isEnabled) {
                result.sideEffects.push([key, ...args, properties])
                return sideEffects[key](...args)
              }
            }
            return acc
          }, accumulator),
          store,
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
