import { USER_REGISTERED } from '../event-types'

export default {
  Init: () => ({
    isExist: false
  }),
  [USER_REGISTERED]: state => ({
    ...state,
    isExist: true
  })
}
