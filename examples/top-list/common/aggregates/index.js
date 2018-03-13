import uuidV4 from 'uuid/v4'

export default [
  {
    name: 'News',
    commands: {
      addNews: (_, { payload: { content, timestamp } }) => ({
        type: 'NewsAdded',
        payload: {
          id: uuidV4(),
          timestamp,
          content
        }
      })
    }
  }
]
