import { createActions } from 'resolve-redux'

import aggregates from '../../common/aggregates'

export default aggregates.reduce(
  (result, aggregate) => ({ ...result, ...createActions(aggregate) }),
  {}
)
