// @flow

import {
  STORY_COMMENTED,
  STORY_CREATED,
  STORY_UNVOTED,
  STORY_UPVOTED,
  USER_CREATED
} from '../../events'
import {
  type Event,
  type StoryCommented,
  type StoryCreated,
  type StoryUnvoted,
  type StoryUpvoted,
  type UserCreated
} from '../../../flow-types/events'

export default {
  Init: async store => {
    await store.defineStorage('Stories', [
      { name: 'id', type: 'string', index: 'primary' },
      { name: 'type', type: 'string', index: 'secondary' },
      { name: 'title', type: 'string' },
      { name: 'text', type: 'string' },
      { name: 'link', type: 'string' },
      { name: 'commentCount', type: 'number' },
      { name: 'votes', type: 'json' },
      { name: 'createdAt', type: 'number' },
      { name: 'createdBy', type: 'string' },
      { name: 'createdByName', type: 'string' }
    ])

    await store.defineStorage('Users', [
      { name: 'id', type: 'string', index: 'primary' },
      { name: 'name', type: 'string', index: 'secondary' },
      { name: 'createdAt', type: 'number' }
    ])

    await store.defineStorage('Comments', [
      { name: 'id', type: 'string', index: 'primary' },
      { name: 'text', type: 'string' },
      { name: 'parentId', type: 'string' },
      { name: 'comments', type: 'json' },
      { name: 'storyId', type: 'string' },
      { name: 'createdAt', type: 'number' },
      { name: 'createdBy', type: 'string' },
      { name: 'createdByName', type: 'string' }
    ])
  },
  [STORY_COMMENTED]: async (
    store,
    {
      aggregateId,
      timestamp,
      payload: { parentId, userId, userName, commentId, text }
    }: Event<StoryCommented>
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

  [STORY_CREATED]: async (
    store,
    {
      aggregateId,
      timestamp,
      payload: { title, link, userId, userName, text }
    }: Event<StoryCreated>
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

  [STORY_UPVOTED]: async (
    store,
    { aggregateId, payload: { userId } }: Event<StoryUpvoted>
  ) => {
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

  [STORY_UNVOTED]: async (
    store,
    { aggregateId, payload: { userId } }: Event<StoryUnvoted>
  ) => {
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
    { aggregateId, timestamp, payload: { name } }: Event<UserCreated>
  ) => {
    const user = {
      id: aggregateId,
      name,
      createdAt: timestamp
    }
    await store.insert('Users', user)
  }
}
