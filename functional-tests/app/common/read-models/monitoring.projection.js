import { MONITORING_FAILED_HANDLER } from '../event-types'

export default {
  [MONITORING_FAILED_HANDLER]: async () => {
    throw Error('Test read model: event handler failed')
  },
}
