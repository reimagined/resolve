import Immutable from 'seamless-immutable'

export default {
  name: 'news',
  projection: {
    Init: () => Immutable({}),
    NEWS_CREATED: (state, { payload: { userId } }) =>
      state.merge({
        createdAt: Date.now(),
        createdBy: userId,
        voted: [],
        comments: {}
      })
  },
  commands: {
    createNews: (state, { payload: { title, link, userId, text } }) => {
      if (state.createdAt) {
        throw new Error('Aggregate already exists')
      }

      if (!title) {
        throw new Error('Title is required')
      }

      if (!userId) {
        throw new Error('UserId is required')
      }

      return {
        type: 'NEWS_CREATED',
        payload: {
          title,
          text,
          link,
          userId
        }
      }
    }
  }
}
