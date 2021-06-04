import { AggregateProjection } from '@resolve-js/core'
import { NOTE_CREATED, NOTE_MODIFIED, NOTE_DELETED } from '../event-types'

const projection: AggregateProjection = {
  Init: () => ({}),
  [NOTE_CREATED]: (state, { timestamp }) => ({
    ...state,
    modifiedAt: timestamp,
  }),
  [NOTE_MODIFIED]: (state, { timestamp, payload: { text } }) => ({
    ...state,
    text,
    modifiedAt: timestamp,
  }),
  [NOTE_DELETED]: () => ({}),
}

export default projection