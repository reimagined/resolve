export default [
  {
    name: 'Rating',

    projection: {
      Init: async store => {
        await store.defineTable('Rating', [
          { name: 'id', type: 'string', index: 'primary' },
          { name: 'rating', type: 'number', index: 'secondary' },
          { name: 'name', type: 'string' },
          { name: 'votes', type: 'json' }
        ])
      },

      ItemAppended: async (store, { payload: { id, name } }) => {
        await store.insert('Rating', { id, name, rating: 0, votes: {} })
      },

      RatingIncreased: async (store, { payload: { id, userId } }) => {
        if (
          (await store.count('Rating', { id, [`votes.${userId}`]: true })) > 0
        ) {
          return
        }
        await store.update(
          'Rating',
          { id },
          {
            $inc: { rating: 1 },
            $set: { [`votes.${userId}`]: true }
          }
        )
      },

      RatingDecreased: async (store, { payload: { id, userId } }) => {
        if (
          (await store.count('Rating', { id, [`votes.${userId}`]: true })) < 1
        ) {
          return
        }
        await store.update(
          'Rating',
          { id },
          {
            $inc: { rating: -1 },
            $unset: { [`votes.${userId}`]: true }
          }
        )
      }
    },

    resolvers: {
      TopRating: async (store, args) => {
        const pageNumber = Math.max(
          Number.isInteger(args && +args.page) ? +args.page : 0,
          0
        )
        const pageLength = Math.max(
          Number.isInteger(args && +args.limit) ? +args.limit : 10,
          0
        )
        const skipItems = pageNumber * pageLength

        return await store.find(
          'Rating',
          {},
          { id: 1, rating: 1, name: 1 },
          { rating: -1 },
          skipItems,
          pageLength
        )
      },

      PagesCount: async (store, args) => {
        const pageLength = Math.max(
          Number.isInteger(args && +args.limit) ? +args.limit : 10,
          0
        )
        const count = await store.count('Rating', {})

        return count > 0 ? Math.floor((count - 1) / pageLength) + 1 : 0
      },

      RatingCount: async store => store.count('Rating', {})
    }
  }
]
