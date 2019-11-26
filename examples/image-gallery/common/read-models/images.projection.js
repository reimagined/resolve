import { IMAGE_CREATED } from '../event-types'

export default {
  Init: async store => {
    await store.defineTable('Images', {
      indexes: { id: 'string' },
      fields: ['name', 'uploadId']
    })
  },

  [IMAGE_CREATED]: async (
    store,
    { aggregateId, payload: { name, uploadId } }
  ) => {
    const image = {
      id: aggregateId,
      name,
      uploadId
    }

    await store.insert('Images', image)
  }
}
