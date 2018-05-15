import {
  STORY_COMMENTED,
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED,
  USER_CREATED
} from '../events'

export default {
  Init: async store => {
    await store.defineTable('Stories', [
      { name: 'id', type: 'string', index: 'primary' },
      { name: 'type', type: 'string', index: 'secondary' },
      { name: 'title', type: 'json' },
      { name: 'text', type: 'json' },
      { name: 'link', type: 'json' },
      { name: 'commentCount', type: 'number' },
      { name: 'votes', type: 'json' },
      { name: 'createdAt', type: 'number' },
      { name: 'createdBy', type: 'string' },
      { name: 'createdByName', type: 'string' }
    ])

    await store.defineTable('Users', [
      { name: 'id', type: 'string', index: 'primary' },
      { name: 'name', type: 'string', index: 'secondary' },
      { name: 'createdAt', type: 'number' }
    ])

    await store.defineTable('Comments', [
      { name: 'id', type: 'string', index: 'primary' },
      { name: 'text', type: 'json' },
      { name: 'parentId', type: 'string' },
      { name: 'comments', type: 'json' },
      { name: 'storyId', type: 'string' },
      { name: 'createdAt', type: 'number' },
      { name: 'createdBy', type: 'string' },
      { name: 'createdByName', type: 'string' }
    ])
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
