export default {
  handlers: {

    Init: async ({ store }) => {
      await store.defineTable('processes', {
        indexes: { id: 'string' }
      })
    },

    ALL_PROCESS_KILLED: async ({ store, sideEffects }, event) => {

      const processes = store.find('processes', {})

      for(const process of processes) {
        await sideEffects.executeCommand({
          aggregateName: 'Counter',
          aggregateId: event.aggregateId,
          type: 'PROCESS_KILLED',
          payload: 1,
          jwtToken:
        })

        await store.delete('processes', {
          id: event.aggregateId
        })
      }
    }
  }
}
