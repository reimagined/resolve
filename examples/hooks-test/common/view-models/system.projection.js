import { COMMENT_CREATED } from '../comment_events'

export default {
  Init: () => ({
    comments: 0
  }),
  [COMMENT_CREATED]: (state, { payload: { target, targetId } }) => {
    if (target !== 'system') {
      return state
    }

    return {
      ...state,
      id: targetId,
      comments: state.comments + 1
    }
  }
}
