export default {
  handlers: {
    UPDATE: async ({ sideEffects }, event) => {
      if (sideEffects.isEnabled) {
        const randomCommandType =
          (await sideEffects.getRandom()) > 0.5 ? 'increment' : 'decrement'

        await sideEffects.executeCommand({
          aggregateName: 'Counter',
          aggregateId: event.aggregateId,
          type: randomCommandType,
          payload: 1
        })
      }
    }
  },

  sideEffects: {
    getRandom: async () => {
      return Math.random()
    }
  }
}
