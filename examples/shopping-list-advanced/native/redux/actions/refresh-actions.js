import { REFRESH } from '../action-types'

export const refresh = () => ({
  type: REFRESH,
  payload: {
    timestamp: Date.now()
  }
})
