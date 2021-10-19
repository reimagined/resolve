import { Aggregate } from '@resolve-js/core'
import {
  MEDIA_UPLOAD_COMPLETED,
  MEDIA_UPLOAD_FAILED,
  MEDIA_UPLOAD_STARTED,
} from '../media.events'

const aggregate: Aggregate = {
  startUpload: (state, command) => {
    const { status } = state

    if (status !== 'none') {
      throw Error(`the media is already uploading or has been uploaded`)
    }

    const { mediaId, owner, ownerId } = command.payload

    return {
      type: MEDIA_UPLOAD_STARTED,
      payload: {
        mediaId,
        owner,
        ownerId,
      },
    }
  },
  finishUpload: (state, command) => {
    const { status } = state

    if (status !== 'started') {
      throw Error(`the media uploading has not started or is already completed`)
    }

    const { error } = command.payload

    if (error) {
      return {
        type: MEDIA_UPLOAD_FAILED,
        payload: {
          error,
        },
      }
    }
    return {
      type: MEDIA_UPLOAD_COMPLETED,
    }
  },
}

export default aggregate
