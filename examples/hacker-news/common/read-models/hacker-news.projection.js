import {
  STORY_COMMENTED,
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED,
  USER_CREATED
} from '../event_types'

export default {
  Init: async store => {
    await store.defineTable('Stories', {
      indexes: { id: 'string', type: 'string' },
      fields: [
        'title',
        'text',
        'link',
        'commentCount',
        'votes',
        'createdAt',
        'createdBy',
        'createdByName'
      ]
    })

    await store.defineTable('Users', {
      indexes: { id: 'string', name: 'string' },
      fields: ['createdAt']
    })

    await store.defineTable('Comments', {
      indexes: { id: 'string' },
      fields: [
        'text',
        'parentId',
        'comments',
        'storyId',
        'createdAt',
        'createdBy',
        'createdByName'
      ]
    })
  },
  [STORY_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { title, link, userId, userName, text } }
  ) => {
    const type = !link ? 'ask' : /^(Show HN)/.test(title) ? 'show' : 'story'

    const story = {
      id: aggregateId,
      type,
      title,
      text,
      link,
      commentCount: 0,
      votes: [],
      createdAt: timestamp,
      createdBy: userId,
      createdByName: userName
    }

    await store.insert('Stories', story)
  },

  [STORY_COMMENTED]: async (
    store,
    {
      aggregateId,
      timestamp,
      payload: { parentId, userId, userName, commentId, text }
    }
  ) => {
    const comment = {
      id: commentId,
      text,
      parentId,
      comments: [],
      storyId: aggregateId,
      createdAt: timestamp,
      createdBy: userId,
      createdByName: userName
    }

    await store.insert('Comments', comment)
    await store.update(
      'Stories',
      { id: aggregateId },
      { $inc: { commentCount: 1 } }
    )
  },

  [STORY_UPVOTED]: async (store, { aggregateId, payload: { userId } }) => {
    const story = await store.findOne(
      'Stories',
      { id: aggregateId },
      { votes: 1 }
    )
    await store.update(
      'Stories',
      { id: aggregateId },
      { $set: { votes: story.votes.concat(userId) } }
    )
  },

  [STORY_UNVOTED]: async (store, { aggregateId, payload: { userId } }) => {
    const story = await store.findOne(
      'Stories',
      { id: aggregateId },
      { votes: 1 }
    )
    await store.update(
      'Stories',
      { id: aggregateId },
      { $set: { votes: story.votes.filter(vote => vote !== userId) } }
    )
  },

  [USER_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { name } }
  ) => {
    const user = {
      id: aggregateId,
      name,
      createdAt: timestamp
    }
    await store.insert('Users', user)
  }
}
