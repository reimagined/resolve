const saga = {
  handlers: {
    UPDATE: async ({ sideEffects }, event) => {
      if (sideEffects.isEnabled) {
        const random = await sideEffects.getRandom()
        const randomCommandType = random > 0.5 ? 'increment' : 'decrement'

        await sideEffects.executeCommand({
          aggregateName: 'Counter',
          aggregateId: event.aggregateId,
          type: randomCommandType,
          payload: 1,
        })
      }
    },
  },

  sideEffects: {
    getRandom: async () => {
      return Math.random()
    },
  },
}

export default saga
