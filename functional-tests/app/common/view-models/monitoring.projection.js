import { MONITORING_VIEW_MODEL_FAILED } from '../event-types'

const projection = {
  Init: () => null,
  [MONITORING_VIEW_MODEL_FAILED]: () => {
    throw new Error('Test error: view model projection failed')
  },
}

export default projection
