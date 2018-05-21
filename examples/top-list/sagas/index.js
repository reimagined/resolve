import generateCodename from 'project-name-generator'

const ITEMS_COUNT = 100

const rand = max => Math.floor(Math.random() * max)

const upFirstLetter = str => {
  return str.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  })
}

const mainSaga = {
  cronHandlers: {
    '* * * * * *': async (_, { resolve }) => {
      const ratingCount = await resolve.executeReadModelQuery({
        modelName: 'Rating',
        resolverName: 'RatingCount'
      })

      if (ratingCount < ITEMS_COUNT) {
        await resolve.executeCommand({
          aggregateId: 'root-id',
          aggregateName: 'Rating',
          type: 'append',
          payload: {
            id: `Item${ratingCount}`,
            name: upFirstLetter(generateCodename().spaced)
          }
        })
      }

      await resolve.executeCommand({
        aggregateId: 'root-id',
        aggregateName: 'Rating',
        type: rand(2) === 0 ? 'upvote' : 'downvote',
        payload: {
          id: `Item${rand(ratingCount)}`,
          userId: `User${rand(ratingCount)}`
        }
      })
    }
  }
}

export default [mainSaga]
