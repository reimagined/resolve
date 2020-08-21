import {
  AdapterImplementation,
  AdapterState,
  Status,
  IAdapterOptions,
  IEventFromDatabase
} from './types'

import throwWhenDisposed from './throw-when-disposed'

async function connectOnDemand<
  AdapterConnection extends any,
  AdapterOptions extends IAdapterOptions,
  EventFromDatabase extends IEventFromDatabase
>(
  state: AdapterState<AdapterConnection, AdapterOptions>,
  implementation: AdapterImplementation<
    AdapterConnection,
    AdapterOptions,
    EventFromDatabase
  >
): Promise<void> {
  throwWhenDisposed(state)
  if (state.status === Status.NOT_CONNECTED) {
    state.connection = await implementation.connect(state.config)
    state.status = Status.CONNECTED
  }
}

export default connectOnDemand
