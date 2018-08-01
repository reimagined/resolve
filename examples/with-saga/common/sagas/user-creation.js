const outdatedPeriod = 1000 * 60 * 10

const saga = {
  eventHandlers: {
    UserCreationRequested: async (event, { resolve }) => {
      const { aggregateId } = event
      const createdUser = await resolve.executeReadModelQuery({
        modelName: 'default',
        resolverName: 'createdUser',
        resolverArgs: { id: aggregateId }
      })

      if (!createdUser) {
        return
      }

      const users = await resolve.executeReadModelQuery({
        modelName: 'default',
        resolverName: 'users',
        resolverArgs: { id: aggregateId }
      })

      const userWithSameEmail = users.find(
        user => user.email === createdUser.email
      )

      await resolve.executeCommand({
        type: userWithSameEmail ? 'rejectUserCreation' : 'confirmUserCreation',
        aggregateName: 'user',
        payload: { createdUser },
        aggregateId
      })
    }
  },
  cronHandlers: {
    '0 */10 * * * *': async (_, { resolve }) => {
      const users = await resolve.executeReadModelQuery({
        modelName: 'default',
        resolverName: 'users'
      })

      const now = Date.now()

      users.forEach(user => {
        if (user.timestamp + outdatedPeriod < now) {
          resolve.executeCommand({
            type: 'deleteOutdatedUser',
            aggregateName: 'user',
            aggregateId: user.id
          })
        }
      })
    }
  }
}

export default saga
