import { IS_BUILT_IN } from '@resolve-js/core'

function deserializeState(state) {
  return JSON.parse(state)
}

deserializeState[IS_BUILT_IN] = true

export default deserializeState
