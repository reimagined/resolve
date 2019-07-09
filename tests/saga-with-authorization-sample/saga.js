import jsonwebtoken from 'jsonwebtoken'

import jwtSecret from './jwt-secret'

export const jwtToken = jsonwebtoken.sign(
  {
    permissions: {
      processes: {
        kill: true
      }
    }
  },
  jwtSecret,
  {
    noTimestamp: true
  }
)

export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('Processes', {
        indexes: { id: 'string' },
        fields: []
      })
    },

    PROCESS_CREATED: async ({ store }, event) => {
      await store.insert('Processes', {
        id: event.aggregateId
      })
    },

    ALL_PROCESS_KILLED: async ({ store, sideEffects }) => {
      const processes = await store.find('Processes', {})

      for (const process of processes) {
        await sideEffects.executeCommand({
          aggregateName: 'Process',
          aggregateId: process.id,
          type: 'PROCESS_KILLED',
          jwtToken
        })

        await store.delete('Processes', {
          id: process.id
        })
      }
    }
  }
}
