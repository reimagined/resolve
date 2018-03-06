export default [
  {
    name: 'News',
    commands: {
      addNews: (_, { payload: { content, timestamp } }) => ({
        type: 'NewsAdded',
        payload: {
          id: `ID${Math.floor(Math.random() * 1000000000000)}`,
          timestamp,
          content
        }
      })
    }
  }
]
