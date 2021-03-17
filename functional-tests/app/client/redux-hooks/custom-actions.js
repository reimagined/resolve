export const COUNTER_INCREMENT = 'COUNTER_INCREMENT'
export const COUNTER_STATE_UPDATE = 'COUNTER_STATE_UPDATE'

export const counterIncrement = (id) => ({
  type: COUNTER_INCREMENT,
  payload: {
    id,
  },
})

export const counterStateUpdate = (id, counter, initial) => ({
  type: COUNTER_STATE_UPDATE,
  payload: {
    id,
    counter,
    initial,
  },
})
