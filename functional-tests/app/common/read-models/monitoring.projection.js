import { MONITORING_FAILED_HANDLER } from '../event-types'

const aggregate = {
  [MONITORING_FAILED_HANDLER]: async () => {
    throw Error('Test read model: event handler failed')
  },
}

export default aggregate
