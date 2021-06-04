import { ViewModelProjection } from '@resolve-js/core'
import { NOTE_CREATED, NOTE_MODIFIED } from '../event-types'

type NoteState = {
  text: string | null
  modifiedAt: number | null
}

const projection: ViewModelProjection<NoteState> = {
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
