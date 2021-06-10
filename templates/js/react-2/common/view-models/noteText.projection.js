import { NOTE_CREATED, NOTE_MODIFIED } from '../event-types'
const projection = {
  Init: () => ({
    text: null,
    modifiedAt: null,
  }),
  [NOTE_CREATED]: (state, { timestamp }) => ({
    ...state,
    modifiedAt: timestamp,
  }),
  [NOTE_MODIFIED]: (state, { timestamp, payload: { text } }) => ({
    text,
    modifiedAt: timestamp,
  }),
}
export default projection
