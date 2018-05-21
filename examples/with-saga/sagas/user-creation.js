const outdatePeriod = 1000 * 60 * 10

const saga = {
  eventHandlers: {
    UserCreationRequested: async ({ aggregateId }, { resolve }) => {
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
        aggregateName: 'User',
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
        if (user.creationTime + outdatePeriod < now) {
          resolve.executeCommand({
            type: 'deleteOutdatedUser',
            aggregateName: 'User',
            aggregateId: user.id
          })
        }
      })
    }
  }
}

export default saga
