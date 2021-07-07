import { MONITORING_FAILED_HANDLER } from '../event-types'

const aggregate = {
  failReadModelProjection: () => ({
    type: MONITORING_FAILED_HANDLER,
    payload: {},
  }),
  failCommandA: () => {
    throw new Error('Test aggregate: command A failed')
  },
  failCommandB: () => {
    throw new Error('Test aggregate: command B failed')
  },
}

export default aggregate
