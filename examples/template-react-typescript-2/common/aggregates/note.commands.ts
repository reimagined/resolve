import { NOTE_CREATED, NOTE_DELETED, NOTE_MODIFIED } from '../event-types'

export default {
  createNote: (state, { payload: { text } }) => {
    if (state.modifiedAt) {
      throw new Error('Note already exists')
    }
    return {
      type: NOTE_CREATED,
      payload: { text },
    }
  },
  modifyNote: (state, { payload: { text } }) => {
    if (!state.modifiedAt) {
      throw new Error('Note does not exist')
    }
    return {
      type: NOTE_MODIFIED,
      payload: { text },
    }
  },
  deleteNote: (state) => {
    if (!state.modifiedAt) {
      throw new Error('Note does not exist')
    }
    return {
      type: NOTE_DELETED,
    }
  },
}
