import {
  MONITORING_EXECUTED_HANDLER,
  MONITORING_FAILED_HANDLER,
} from '../event-types'

const readModel = {
  [MONITORING_EXECUTED_HANDLER]: async () => void 0,
  [MONITORING_FAILED_HANDLER]: async () => {
    throw Error('Test read model: event handler failed')
  },
}

export default readModel
