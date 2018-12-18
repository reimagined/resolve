import { aggregates } from '../../resolve'
import { createActions } from 'resolve-redux'

const actions = {}
for (const aggregate of aggregates) {
  Object.assign(actions, createActions(aggregate))
}

export default actions
