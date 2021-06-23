import { AggregateProjection } from '@resolve-js/core'
import {
  USER_REGISTERED,
  USER_PROFILE_UPDATED,
  USER_PROFILE_DELETED,
} from '../user-profile.events'

const projection: AggregateProjection = {
  Init: () => ({
    isRegistered: false,
    isDeleted: false,
  }),
  [USER_REGISTERED]: (
    state,
    { payload: { firstName, lastName, contacts } }
  ) => ({
    ...state,
    isRegistered: true,
    firstName,
    lastName,
    contacts,
  }),
  [USER_PROFILE_UPDATED]: (
    state,
    { payload: { firstName, lastName, contacts } }
  ) => ({
    ...state,
    firstName,
    lastName,
    contacts,
  }),
  [USER_PROFILE_DELETED]: (state) => ({
    ...state,
    isRegistered: false,
    isDeleted: true,
  }),
}

export default projection
