import { SHOPPING_LIST_CREATED, SHOPPING_LIST_REMOVED } from '../eventTypes'

export default {
  Init: () => ({}),
  [SHOPPING_LIST_CREATED]: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp,
  }),
  [SHOPPING_LIST_REMOVED]: () => ({}),
}
