const NEWS_PER_PAGE = 10

export default [
  {
    name: 'News',

    projection: {
      Init: async store => {
        await store.defineStorage('News', [
          { name: 'id', type: 'string', index: 'primary' },
          { name: 'timestamp', type: 'number', index: 'secondary' },
          { name: 'content', type: 'string' }
        ])
      },

      NewsAdded: async (store, event) => {
        await store.insert('News', {
          id: event.payload.id,
          timestamp: event.payload.timestamp,
          content: event.payload.content
        })
      }
    },

    gqlSchema: `
      type NewsItem {
        id: ID!
        timestamp: Int!
        content: String!
      }
      type Query {
        LatestNews(page: Int!): [NewsItem]
        PagesCount: Int!
      }
    `,

    gqlResolvers: {
      LatestNews: async (store, args) => {
        const skip =
          Math.max(Number.isInteger(args && +args.page) ? +args.page : 0, 0) * NEWS_PER_PAGE
        return await store.find('News', {}, null, { timestamp: -1 }, skip, NEWS_PER_PAGE)
      },

      PagesCount: async store => {
        const newsCount = await store.count('News', {})
        if (newsCount > 0) {
          return Math.floor((newsCount - 1) / NEWS_PER_PAGE) + 1
        }
        return 0
      }
    }
  }
]
