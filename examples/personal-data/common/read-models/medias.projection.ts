import { ReadModel } from 'resolve-core'
import { ResolveStore } from 'resolve-readmodel-base'
import { MEDIA_UPLOAD_STARTED } from '../media.events'

const readModel: ReadModel<ResolveStore> = {
  Init: async (store): Promise<void> => {
    await store.defineTable('Media', {
      indexes: { id: 'string', mediaId: 'string' },
      fields: ['owner', 'timestamp']
    })
  },
  [MEDIA_UPLOAD_STARTED]: async (store, event): Promise<void> => {
    const {
      aggregateId,
      timestamp,
      payload: { mediaId, ownerId }
    } = event

    await store.insert('Media', {
      owner: ownerId,
      id: aggregateId,
      timestamp,
      mediaId
    })
  }
}

export default readModel
