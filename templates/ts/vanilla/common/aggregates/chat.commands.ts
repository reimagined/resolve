import { Aggregate } from '@resolve-js/core'

const aggregate: Aggregate = {
  postMessage: (_, { payload }) => ({
    type: 'MESSAGE_POSTED',
    payload,
  }),
}

export default aggregate
