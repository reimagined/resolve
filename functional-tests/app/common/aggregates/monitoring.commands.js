import {
  MONITORING_EXECUTED_HANDLER,
  MONITORING_FAILED_HANDLER,
  MONITORING_VIEW_MODEL_FAILED,
} from '../event-types'

const aggregate = {
  executeReadModelProjection: () => ({
    type: MONITORING_EXECUTED_HANDLER,
    payload: {},
  }),
  failReadModelProjection: () => ({
    type: MONITORING_FAILED_HANDLER,
    payload: {},
  }),
  failViewModelProjection: () => ({
    type: MONITORING_VIEW_MODEL_FAILED,
    payload: {},
  }),
  failCommand: () => {
    throw new Error('Test aggregate: command failed')
  },
}

export default aggregate
