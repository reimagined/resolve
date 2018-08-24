import { aggregates } from '../../resolve/config'
import { createActions } from '../../resolve/resolve-redux'

const actions = {}
for (const aggregate of aggregates) {
  Object.assign(actions, createActions(aggregate))
}

export default actions
