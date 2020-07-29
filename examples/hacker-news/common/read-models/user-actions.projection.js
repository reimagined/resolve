import {
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED,
  USER_CREATED
} from '../event-types'

export default {
  Init: async store => {
    await store.defineTable('UserActions', {
      indexes: { userId: 'string' },
      fields: ['upvoteCount', 'unvoteCount', 'storyCount', 'commentCount']
    })
  },

  [USER_CREATED]: async (store, { payload: { userId } }) => {
    await store.insert('UserActions', {
      userId,
      upvoteCount: 0,
      unvoteCount: 0,
      storyCount: 0,
      commentCount: 0
    })
  },

  [STORY_CREATED]: async (store, { payload: { userId } }) => {
    await store.update('UserActions', { userId }, { $inc: { storyCount: 1 } })
  },

  [STORY_UPVOTED]: async (store, { payload: { userId } }) => {
    await store.update('UserActions', { userId }, { $inc: { upvoteCount: 1 } })
  },

  [STORY_UNVOTED]: async (store, { payload: { userId } }) => {
    await store.update('UserActions', { userId }, { $inc: { unvoteCount: 1 } })
  },

  COMMENT_CREATED: async (store, { payload: { authorId } }) => {
    await store.update(
      'UserActions',
      { userId: authorId },
      { $inc: { commentCount: 1 } }
    )
  }
}
