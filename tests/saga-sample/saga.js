// mdis-start
export default {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('users', {
        indexes: { id: 'string' },
        fields: ['mail', 'confirmed']
      })
    },
    USER_CREATED: async ({ store, executeCommand }, event) => {
      await store.insert('users', {
        id: event.aggregateId,
        mail: event.payload.mail,
        confirmed: false
      })
      await executeCommand({
        aggregateName: 'User',
        aggregateId: event.aggregateId,
        type: 'requestConfirmUser',
        payload: event.payload
      })
    },
    USER_CONFIRM_REQUESTED: async ({ sideEffects, scheduleCommand }, event) => {
      await sideEffects.sendEmail(event.payload.mail, 'Confirm mail')

      await scheduleCommand(event.timestamp + 1000 * 60 * 60 * 24 * 7, {
        aggregateName: 'User',
        aggregateId: event.aggregateId,
        type: 'forgetUser',
        payload: {}
      })
    },
    USER_CONFIRMED: async ({ store }, event) => {
      await store.update(
        'users',
        {
          id: event.aggregateId
        },
        {
          $set: { confirmed: true }
        }
      )
    },
    USER_FORGOTTEN: async ({ store }, event) => {
      await store.delete('users', {
        id: event.aggregateId
      })
    }
  },
  sideEffects: {
    sendEmail: async (mail, content) => {
      // mdis-stop
      // eslint-disable-next-line no-console
      console.log(mail, content)
      // mdis-start
    }
  }
}
// mdis-stop
