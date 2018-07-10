import {
  USER_CREATION_REQUESTED,
  USER_CREATION_CONFIRMED,
  USER_CREATION_REJECTED,
  OUTDATED_USER_DELETED
} from '../event-names'

export default {
  [USER_CREATION_REQUESTED]: () => ({
    isConfirmed: false
  }),
  [USER_CREATION_CONFIRMED]: state => ({
    ...state,
    isConfirmed: true
  }),
  [USER_CREATION_REJECTED]: () => null,
  [OUTDATED_USER_DELETED]: () => null
}
