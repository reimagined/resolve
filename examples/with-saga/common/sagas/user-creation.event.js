const eventHandlers = {
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
}

export default eventHandlers
