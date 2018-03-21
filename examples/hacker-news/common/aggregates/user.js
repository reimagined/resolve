// @flow
import { USER_CREATED } from '../events'
import validate from './validation'
import {
  type Event,
  type RawEvent,
  type UserCreated
} from '../../flow-types/events'

export default {
  name: 'user',
  initialState: {},
  commands: {
    createUser: (state: any, command: any): RawEvent<UserCreated> => {
      validate.stateIsAbsent(state, 'User')

      const { name } = command.payload

      validate.fieldRequired(command.payload, 'name')

      return { type: USER_CREATED, payload: { name } }
    }
  },
  projection: {
    [USER_CREATED]: (state, { timestamp }: Event<UserCreated>) => ({
      ...state,
      createdAt: timestamp
    })
  }
}
