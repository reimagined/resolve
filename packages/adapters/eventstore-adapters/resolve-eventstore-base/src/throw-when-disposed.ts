import { AdapterState, IAdapterOptions, Status } from './types'

function throwWhenDisposed<
  AdapterConnection extends any,
  AdapterOptions extends IAdapterOptions
>(state: AdapterState<AdapterConnection, AdapterOptions>): void {
  if (state.status === Status.DISPOSED) {
    throw new Error('Adapter is already disposed')
  }
}

export default throwWhenDisposed
