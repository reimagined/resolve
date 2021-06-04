import { NOTE_CREATED, NOTE_MODIFIED, NOTE_DELETED } from '../event-types'

export default {
  Init: () => ({
    name: '',
    id: null,
    text: null,
    modifiedAt: null,
  }),
  [NOTE_CREATED]: (state, { aggregateId, timestamp, payload: { text } }) => ({
    id: aggregateId,
    text,
    modifiedAt: timestamp,
  }),
  [NOTE_MODIFIED]: (state, { aggregateId, timestamp, payload: { text } }) => ({
    id: aggregateId,
    text,
    modifiedAt: timestamp,
  }),
  [NOTE_DELETED]: () => ({
    removed: true,
  }),
}
