import { ReadModel } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'
import {
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED,
  USER_CREATED,
} from '../event-types'

type Story = {
  id: string
  type: string
  title: string
  text: string
  link: string
  commentCount: number
  votes: string[]
  createdAt: number
  createdBy: string
  createdByName: string
}

const hackerNewsProjection: ReadModel<ResolveStore> = {
  Init: async (store) => {
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
        'createdByName',
      ],
    })

    await store.defineTable('Users', {
      indexes: { id: 'string', name: 'string' },
      fields: ['createdAt'],
    })
  },

  [STORY_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { title, link, userId, userName, text } }
  ) => {
    const isAsk = link == null || link === ''
    const type = isAsk ? 'ask' : /^(Show HN)/.test(title) ? 'show' : 'story'

    const story: Story = {
      id: aggregateId,
      type,
      title,
      text,
      link: !isAsk ? link : '',
      commentCount: 0,
      votes: [],
      createdAt: timestamp,
      createdBy: userId,
      createdByName: userName,
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
      { $set: { votes: story.votes.filter((vote: string) => vote !== userId) } }
    )
  },

  [USER_CREATED]: async (
    store,
    { aggregateId, timestamp, payload: { name } }
  ) => {
    const user = {
      id: aggregateId,
      name,
      createdAt: timestamp,
    }
    await store.insert('Users', user)
  },

  /* from module "@resolve-js/module-comments" */
  COMMENT_CREATED: async (store, { aggregateId }) => {
    await store.update(
      'Stories',
      { id: aggregateId },
      { $inc: { commentCount: 1 } }
    )
  },

  /* from module "@resolve-js/module-comments" */
  COMMENT_REMOVED: async (store, { aggregateId }) => {
    await store.update(
      'Stories',
      { id: aggregateId },
      { $inc: { commentCount: -1 } }
    )
  },
}

export default hackerNewsProjection
