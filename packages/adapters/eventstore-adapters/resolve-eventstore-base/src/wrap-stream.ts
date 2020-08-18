import {
  AdapterState,
  AdapterImplementation,
  IAdapter,
  IAdapterOptions,
  IEventFromDatabase
} from './types'

import throwWhenDisposed from './throw-when-disposed'
import connectOnDemand from './connect-on-demand'

function wrapStream<
  Args extends Array<any>,
  Result extends any,
  AdapterConnection extends any,
  Adapter extends IAdapter,
  AdapterOptions extends IAdapterOptions,
  EventFromDatabase extends IEventFromDatabase
>(
  state: AdapterState<AdapterConnection, AdapterOptions>,
  implementation: AdapterImplementation<
    AdapterConnection,
    AdapterOptions,
    EventFromDatabase
  >,
  method: (
    state: AdapterState<AdapterConnection, AdapterOptions>,
    ...args: Args
  ) => Promise<Result>
): (...args: Args) => Promise<Result> {
  return async (...args: Args) => {
    throwWhenDisposed(state)
    await connectOnDemand(state, implementation)
    const connection = state.connection
    if (connection == null) {
      throw new Error('Bad connection')
    }
    return method(state, ...args)
  }
}

export default wrapStream
