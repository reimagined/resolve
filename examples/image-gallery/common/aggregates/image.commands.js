import { IMAGE_CREATED } from '../event-types'

export default {
  createImage: (state, command) => {
    const { name, uploadId } = command.payload

    if (state.createdAt != null) {
      throw new Error('Image is already exists')
    }

    return {
      type: IMAGE_CREATED,
      payload: { name, uploadId }
    }
  }
}
