import { MONITORING_FAILED_HANDLER } from '../event-types'

const aggregate = {
  failReadModelProjection: () => ({
    type: MONITORING_FAILED_HANDLER,
    payload: {},
  }),
  failCommand: () => {
    throw new Error('Test aggregate: command failed')
  },
}

export default aggregate
