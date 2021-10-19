import { USER_REGISTERED } from '../event-types'

const projection = {
  Init: () => ({
    isExist: false,
  }),
  [USER_REGISTERED]: (state) => ({
    ...state,
    isExist: true,
  }),
}

export default projection
