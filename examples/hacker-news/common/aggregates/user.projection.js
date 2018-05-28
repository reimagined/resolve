import { USER_CREATED } from "../events";

export default {
  Init: () => ({}),
  [USER_CREATED]: (state, { timestamp }) => ({
    ...state,
    createdAt: timestamp
  })
}