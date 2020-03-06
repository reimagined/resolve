import { IMAGE_CREATED } from '../event-types'

export default {
  createImage: (state, command) => {
    const { name, uploadId } = command.payload

    return {
      type: IMAGE_CREATED,
      payload: { name, uploadId }
    }
  }
}
