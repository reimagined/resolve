import {
  MEDIA_UPLOAD_COMPLETED,
  MEDIA_UPLOAD_FAILED,
  MEDIA_UPLOAD_STARTED
} from '../media.events'
import { Aggregate } from 'resolve-core'

const aggregate: Aggregate = {
  startUpload: (state, command) => {
    const { status } = state

    if (status !== 'none') {
      throw Error(`the media already uploading or uploaded`)
    }

    const { mediaId, owner, ownerId } = command.payload

    return {
      type: MEDIA_UPLOAD_STARTED,
      payload: {
        mediaId,
        owner,
        ownerId
      }
    }
  },
  finishUpload: (state, command) => {
    const { status } = state

    if (status !== 'started') {
      throw Error(`the media uploading not started or already completed`)
    }

    const { error } = command.payload

    if (error) {
      return {
        type: MEDIA_UPLOAD_FAILED,
        payload: {
          error
        }
      }
    }
    return {
      type: MEDIA_UPLOAD_COMPLETED
    }
  }
}

export default aggregate
