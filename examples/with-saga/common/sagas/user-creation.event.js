const eventHandlers = {
  UserCreationRequested: async (event, { resolve }) => {
    const { aggregateId } = event
    let createdUser = null

    // https://10consulting.com/2017/10/06/dealing-with-eventual-consistency/
    while (createdUser == null) {
      createdUser = await resolve.executeQuery({
        modelName: 'default',
        resolverName: 'createdUser',
        resolverArgs: { id: aggregateId }
      })

      await new Promise(resolve => setTimeout(resolve, 100))
    }

    const users = await resolve.executeQuery({
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
