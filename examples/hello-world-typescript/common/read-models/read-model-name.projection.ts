import { ResolveStore } from '@resolve-js/readmodel-base'

export default {
  Init: async (store: ResolveStore): Promise<void> => {
    await store.defineTable('History', {
      indexes: { id: 'string' },
      fields: ['events'],
    })
  },
  EventType: async (
    store: ResolveStore,
    {
      aggregateId,
      timestamp,
      payload: { a, b },
    }: {
      aggregateId: string
      timestamp: number
      payload: {
        a: string
        b: number
      }
    }
  ): Promise<void> => {
    const key = `K${timestamp}`
    if ((await store.count('History', { id: aggregateId })) === 0) {
      await store.insert('History', {
        id: aggregateId,
        events: {
          [key]: { a, b },
        },
      })
    } else {
      await store.update(
        'History',
        {
          id: aggregateId,
        },
        {
          $set: {
            [`events.${key}`]: { a, b },
          },
        }
      )
    }
  },
}
