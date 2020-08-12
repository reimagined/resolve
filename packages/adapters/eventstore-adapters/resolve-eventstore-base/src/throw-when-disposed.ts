import {
  AdapterState,
  Status
} from './types'

function throwWhenDisposed<AdapterConnection extends any>(
  state: AdapterState<AdapterConnection>
): void {
  if (state.status === Status.DISPOSED) {
    throw new Error('Adapter is already disposed')
  }
}

export default throwWhenDisposed
