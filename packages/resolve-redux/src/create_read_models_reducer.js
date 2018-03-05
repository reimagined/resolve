import {
  READMODEL_SUBSCRIPTION_DIFF,
  READMODEL_LOAD_INITIAL_STATE,
  READMODEL_DROP_STATE
} from './action_types'
import { applyChange } from 'diff-json'

export default function createReadModelsReducer() {
  return (state = {}, action) => {
    switch (action.type) {
      case READMODEL_LOAD_INITIAL_STATE: {
        const { readModelName, resolverName, initialState } = action
        return {
          ...state,
          [readModelName]: {
            ...(state[readModelName] || {}),
            [resolverName]: initialState
          }
        }
      }
      case READMODEL_DROP_STATE: {
        const { readModelName, resolverName } = action
        const nextState = {
          ...state,
          [readModelName]: {
            ...(state[readModelName] || {}),
            [resolverName]: null
          }
        }

        delete nextState[readModelName][resolverName]

        return nextState
      }
      case READMODEL_SUBSCRIPTION_DIFF: {
        const { readModelName, resolverName, diff } = action

        if (!state[readModelName] || !state[readModelName].hasOwnProperty(resolverName)) {
          return state
        }

        const result = applyChange(state[readModelName][resolverName], diff)

        return {
          ...state,
          [readModelName]: {
            ...state[readModelName],
            [resolverName]: result
          }
        }
      }

      default:
        return state
    }
  }
}
