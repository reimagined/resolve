/* eslint-disable import/no-anonymous-default-export*/
// mdis-start
export default {
  handlers: {
    // mdis-start init
    Init: async ({ store }) => {
      await store.defineTable('users', {
        indexes: { id: 'string' },
        fields: ['mail'],
      })
    },
    // mdis-stop init
    USER_CREATED: async ({ store, sideEffects }, event) => {
      await store.insert('users', {
        id: event.aggregateId,
        mail: event.payload.mail,
      })
      // mdis-start execute
      await sideEffects.executeCommand({
        aggregateName: 'User',
        aggregateId: event.aggregateId,
        type: 'requestConfirmUser',
        payload: event.payload,
      })
      // mdis-stop execute
    },
    USER_CONFIRM_REQUESTED: async ({ sideEffects }, event) => {
      // mdis-start trigger-side-effect
      await sideEffects.sendEmail(event.payload.mail, 'Confirm mail')
      // mdis-stop trigger-side-effect
      // mdis-start schedule
      await sideEffects.scheduleCommand(
        event.timestamp + 1000 * 60 * 60 * 24 * 7,
        {
          aggregateName: 'User',
          aggregateId: event.aggregateId,
          type: 'forgetUser',
          payload: {},
        }
      )
      // mdis-stop schedule
    },
    USER_FORGOTTEN: async ({ store }, event) => {
      await store.delete('users', {
        id: event.aggregateId,
      })
    },
  },
  // mdis-start define-side-effect
  sideEffects: {
    sendEmail: async (mail, content) => {
      // mdis-stop
      // mdis-stop define-side-effect
      // eslint-disable-next-line no-console
      console.log(mail, content)
      // mdis-start define-side-effect
      // mdis-start
    },
  },
  // mdis-stop define-side-effect
}
// mdis-stop
