import { SHOPPING_LIST_CREATED } from '../eventTypes'

const projection = {
  Init: () => ({}),
  [SHOPPING_LIST_CREATED]: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp,
  }),
}

export default projection
