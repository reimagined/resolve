import { REFRESH } from '../action_types'

export const refresh = () => ({
  type: REFRESH,
  payload: {
    timestamp: Date.now()
  }
})
