import { IS_BUILT_IN } from '@reimagined/core'

function deserializeState(state) {
  return JSON.parse(state)
}

deserializeState[IS_BUILT_IN] = true

export default deserializeState
