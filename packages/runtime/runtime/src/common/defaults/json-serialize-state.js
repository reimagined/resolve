import { IS_BUILT_IN } from '@resolve-js/core'

function serializeState(state) {
  return JSON.stringify(state, null, 2)
}

serializeState[IS_BUILT_IN] = true

export default serializeState
