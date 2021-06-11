import { AggregateProjection } from '@resolve-js/core'
import { SHOPPING_LIST_CREATED, SHOPPING_LIST_REMOVED } from '../event-types'

const projection: AggregateProjection = {
  Init: () => ({}),
  [SHOPPING_LIST_CREATED]: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp,
  }),
  [SHOPPING_LIST_REMOVED]: () => ({}),
}

export default projection
