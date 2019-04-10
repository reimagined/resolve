export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('SagaUsers', {
        indexes: { id: 'string', name: 'string' },
        fields: []
      })
    },
    UserCreated: async (
      { executeCommand, scheduleCommand, store, sideEffects },
      { aggregateId, payload: { name }, timestamp }
    ) => {
      await sideEffects.sendEmail('example@example.com')

      const user = await store.findOne('SagaUsers', { name })

      if (user && user.id !== aggregateId) {
        await executeCommand({
          type: 'rejectUser',
          aggregateName: 'User',
          aggregateId
        })
      } else {
        await store.insert('SagaUsers', {
          id: aggregateId,
          name
        })

        await executeCommand({
          type: 'confirmUser',
          aggregateName: 'User',
          aggregateId
        })

        await scheduleCommand(timestamp + 3000, {
          type: 'activateUser',
          aggregateName: 'User',
          aggregateId
        })
      }
    }
  },
  sideEffects: {
    sendEmail: email => {
      // eslint-disable-next-line no-console
      console.log('Sending email to', email)
    }
  }
}
