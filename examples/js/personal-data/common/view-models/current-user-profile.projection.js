import {
  USER_PROFILE_DELETED,
  USER_PROFILE_UPDATED,
  USER_REGISTERED,
} from '../user-profile.events'
const viewModel = {
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
