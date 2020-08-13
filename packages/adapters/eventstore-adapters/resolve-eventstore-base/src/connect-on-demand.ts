import {
  IAdapterImplementation,
  IAdapterOptions,
  AdapterState,
  Status,
  IEventFromDatabase
} from './types'

import throwWhenDisposed from './throw-when-disposed'

async function connectOnDemand<
  AdapterConnection extends any,
  AdapterImplementation extends IAdapterImplementation<
    AdapterConnection,
    AdapterOptions,
    EventFromDatabase
  >,
  AdapterOptions extends IAdapterOptions,
  EventFromDatabase extends IEventFromDatabase
>(
  options: AdapterOptions,
  state: AdapterState<AdapterConnection>,
  implementation: AdapterImplementation
): Promise<void> {
  throwWhenDisposed(state)
  if (state.status === Status.NOT_CONNECTED) {
    state.connection = await implementation.connect(options)
    state.status = Status.CONNECTED
  }
}

export default connectOnDemand
