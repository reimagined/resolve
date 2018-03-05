export default [
  {
    name: 'News',
    commands: {
      appendNews: (_, { payload: { title, timestamp } }) => ({
        type: 'NEWS_APPENDED',
        payload: { title, timestamp }
      })
    }
  }
]
