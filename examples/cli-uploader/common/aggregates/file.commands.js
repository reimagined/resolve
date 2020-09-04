import {
  FILE_LOADING_START,
  FILE_LOADING_SUCCESS,
  FILE_LOADING_FAILURE,
  FILE_NOT_LOADED,
} from '../event-types'

export default {
  fileNotLoaded: (state, command) => {
    const { userId, projectId } = command.payload

    return {
      type: FILE_NOT_LOADED,
      payload: { userId, projectId },
    }
  },

  startLoadingFile: () => ({
    type: FILE_LOADING_START,
  }),

  successLoadingFile: () => ({
    type: FILE_LOADING_SUCCESS,
  }),

  failureLoadingFile: () => ({
    type: FILE_LOADING_FAILURE,
  }),
}
