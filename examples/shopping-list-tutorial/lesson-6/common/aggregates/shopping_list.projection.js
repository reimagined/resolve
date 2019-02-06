import { SHOPPING_LIST_CREATED } from '../eventTypes'

export default {
  Init: () => ({}),
  [SHOPPING_LIST_CREATED]: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp
  })
}
