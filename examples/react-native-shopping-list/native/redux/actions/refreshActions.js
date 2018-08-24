import { REFRESH } from '../actionTypes'

export const refresh = () => ({
  type: REFRESH,
  payload: {
    timestamp: Date.now()
  }
})