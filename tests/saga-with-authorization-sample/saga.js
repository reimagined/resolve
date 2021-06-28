import jsonwebtoken from 'jsonwebtoken'

import jwtSecret from './jwt-secret'

export const jwt = jsonwebtoken.sign(
  {
    permissions: {
      processes: {
        kill: true,
      },
    },
  },
  jwtSecret,
  {
    noTimestamp: true,
  }
)

const saga = {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('Processes', {
        indexes: { id: 'string' },
        fields: [],
      })
    },

    PROCESS_CREATED: async ({ store }, event) => {
      await store.insert('Processes', {
        id: event.aggregateId,
      })
    },

    ALL_PROCESS_KILLED: async ({ store, sideEffects }) => {
      const processes = await store.find('Processes', {})

      for (const process of processes) {
        await sideEffects.executeCommand({
          aggregateName: 'Process',
          aggregateId: process.id,
          type: 'PROCESS_KILLED',
          jwt,
        })

        await store.delete('Processes', {
          id: process.id,
        })
      }
    },
  },
}

export default saga
