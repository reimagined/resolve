import { ViewModelProjection } from '@resolve-js/core'
import {
  USER_PROFILE_DELETED,
  USER_PROFILE_UPDATED,
  USER_REGISTERED,
} from '../user-profile.events'
import { UserProfileViewModelState } from '../../types'

const viewModel: ViewModelProjection<UserProfileViewModelState | null> = {
  Init: () => null,
  [USER_REGISTERED]: (
    state,
    { aggregateId, payload: { nickname, firstName, lastName, contacts } }
  ) => ({
    id: aggregateId,
    nickname,
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
    firstName: 'deleted user',
    lastName: 'deleted user',
  }),
}

export default viewModel
