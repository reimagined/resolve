import {
  IAdapterImplementation,
  IAdapterOptions,
  AdapterState,
  IEventFromDatabase,
  EventForSave
} from './types'
import throwWhenDisposed from './throw-when-disposed'
import connectOnDemand from './connect-on-demand'

function wrapSaveEvent<
  AdapterConnection extends any,
  AdapterImplementation extends IAdapterImplementation<
    AdapterConnection,
    AdapterOptions,
    EventFromDatabase
  >,
  AdapterOptions extends IAdapterOptions,
  EventFromDatabase extends IEventFromDatabase
>(
  state: AdapterState<AdapterConnection>,
  options: AdapterOptions,
  implementation: AdapterImplementation,
  method: (connection: AdapterConnection, event: EventForSave) => Promise<void>
): (event: EventForSave) => Promise<void> {
  return async (event: EventForSave) => {
    throwWhenDisposed(state)
    await connectOnDemand(options, state, implementation)
    const connection = state.connection
    if (connection == null) {
      throw new Error('Bad connection')
    }
    if (
      typeof implementation.isFrozen === 'function' &&
      (await implementation.isFrozen())
    ) {
      throw new Error('Event store is frozen')
    }
    return method(connection, event)
  }
}

export default wrapSaveEvent
