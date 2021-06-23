import { ViewModelProjection } from '@resolve-js/core'
import { ChatViewModelState } from '../../types'

const projection: ViewModelProjection<ChatViewModelState> = {
  Init: () => [],
  MESSAGE_POSTED: (state, { payload: { userName, message } }) =>
    state.concat({
      userName,
      message,
    }),
}

export default projection
