import { eventTypes as moduleCommentsEventTypes } from 'resolve-module-comments'

import {
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED,
  USER_CREATED
} from '../event_types'

const { COMMENT_CREATED, COMMENT_REMOVED } = moduleCommentsEventTypes

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
  },

  [COMMENT_CREATED]: async (store, { aggregateId }) => {
    await store.update(
      'Stories',
      { id: aggregateId },
      { $inc: { commentCount: 1 } }
    )
  },

  [COMMENT_REMOVED]: async (store, { aggregateId }) => {
    await store.update(
      'Stories',
      { id: aggregateId },
      { $inc: { commentCount: -1 } }
    )
  }
}
