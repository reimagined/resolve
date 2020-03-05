import { COMMENT_CREATED } from '../comment_events'

export default {
  Init: () => ({
    isExist: false
  }),
  [COMMENT_CREATED]: state => ({
    ...state,
    isExist: true
  })
}
