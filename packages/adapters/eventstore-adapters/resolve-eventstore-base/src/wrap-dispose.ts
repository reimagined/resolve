import {
  IAdapterImplementation,
  IAdapterOptions,
  IAdapter,
  IEventFromDatabase,
  AdapterState,
  Status
} from './types'
import throwWhenDisposed from './throw-when-disposed'

function wrapDispose<
  Args extends Array<any>,
  Result extends any,
  AdapterConnection extends any,
  AdapterImplementation extends IAdapterImplementation<
    AdapterConnection,
    AdapterOptions,
    EventFromDatabase
  >,
  Adapter extends IAdapter,
  AdapterOptions extends IAdapterOptions,
  EventFromDatabase extends IEventFromDatabase
>(
  state: AdapterState<AdapterConnection>,
  options: AdapterOptions,
  dispose: (connection: AdapterConnection, ...args: Args) => Promise<void>
): (...args: Args) => Promise<void> {
  return async (...args: Args) => {
    throwWhenDisposed(state)
    state.status = Status.DISPOSED
    const connection = state.connection
    if (connection == null) {
      return
    }
    await dispose(connection, ...args)
  }
}

export default wrapDispose
