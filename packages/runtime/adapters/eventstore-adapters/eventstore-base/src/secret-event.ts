import { nanoid } from 'nanoid'
import { InputEvent } from './types'

const saltSize = 10

export const SET_SECRET_EVENT_TYPE = 'RESOLVE_SET_SECRET'
export const DELETE_SECRET_EVENT_TYPE = 'RESOLVE_DELETE_SECRET'

export function makeSetSecretEvent(id: string): InputEvent {
  return {
    type: SET_SECRET_EVENT_TYPE,
    timestamp: 1,
    aggregateId: SET_SECRET_EVENT_TYPE + '_' + id + '_' + nanoid(saltSize),
    aggregateVersion: 1,
    payload: {
      id: id,
    },
  }
}

export function makeDeleteSecretEvent(id: string): InputEvent {
  return {
    type: DELETE_SECRET_EVENT_TYPE,
    timestamp: 1,
    aggregateId: DELETE_SECRET_EVENT_TYPE + '_' + id + '_' + nanoid(saltSize),
    aggregateVersion: 1,
    payload: {
      id: id,
    },
  }
}
