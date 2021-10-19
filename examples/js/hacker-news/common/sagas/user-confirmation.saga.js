import { USER_CREATED, USER_CONFIRMED, USER_REJECTED } from '../event-types'
const userConfirmationSaga = {
  handlers: {
    Init: async ({ store }) => {
      await store.defineTable('SagaUsers', {
        indexes: { id: 'string', name: 'string' },
        fields: ['registrationDate'],
      })
    },
    [USER_CREATED]: async (
      { store, sideEffects },
      { aggregateId, payload: { name }, timestamp }
    ) => {
      const user = await store.findOne('SagaUsers', { name })
      if (user && user.id !== aggregateId) {
        await sideEffects.executeCommand({
          type: 'rejectUser',
          aggregateName: 'User',
          aggregateId,
          payload: {
            reason: 'user with the same name already registered and confirmed',
          },
        })
      } else {
        await sideEffects.sendEmail(
          'admin@resolve.sh',
          `${name} registration request`,
          `Please confirm your registration or the user will be deleted in 1 hour`
        )
        await sideEffects.scheduleCommand(timestamp + 60000, {
          type: 'rejectUser',
          aggregateName: 'User',
          aggregateId,
          payload: {
            reason:
              'user registration was not confirmed within the allowed time period',
          },
        })
      }
    },
    [USER_CONFIRMED]: async (
      { store },
      { aggregateId, timestamp, payload: { name } }
    ) => {
      await store.insert('SagaUsers', {
        id: aggregateId,
        name,
        registrationDate: timestamp,
      })
    },
    [USER_REJECTED]: async ({ sideEffects }, { aggregateId }) => {
      await sideEffects.sendEmail(
        'admin@resolve.sh',
        `${aggregateId} registration declined`,
        `No confirmation received.`
      )
    },
  },
  sideEffects: {
    sendEmail: (email, subject, body) => {
      // eslint-disable-next-line no-console
      console.log(`<${email}> ${subject}: ${body}`)
    },
  },
}
export default userConfirmationSaga
