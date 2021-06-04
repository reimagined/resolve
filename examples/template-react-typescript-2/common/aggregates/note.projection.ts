import { NOTE_CREATED, NOTE_MODIFIED, NOTE_DELETED } from '../event-types'

export default {
  Init: () => ({}),
  [NOTE_CREATED]: (state, { timestamp, payload: { text } }) => ({
    ...state,
    text,
    modifiedAt: timestamp,
  }),
  [NOTE_MODIFIED]: (state, { timestamp, payload: { text } }) => ({
    ...state,
    text,
    modifiedAt: timestamp,
  }),
  [NOTE_DELETED]: () => ({}),
}
