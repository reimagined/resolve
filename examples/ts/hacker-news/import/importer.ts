import { defaults as commentsModule } from '@resolve-js/module-comments'
import { v4 as uuid } from 'uuid'
import { EOL } from 'os'
import { Event } from '@resolve-js/core'

import {
  USER_CREATED,
  STORY_CREATED,
  STORY_UPVOTED,
} from '../common/event-types'
import api from './api'

const { COMMENT_CREATED } = commentsModule

const aggregateVersionsMap = new Map()
let eventTimestamp = Date.now()
const users: { [key: string]: any } = {}

type ImportedEvent = Omit<Event, 'timestamp' | 'aggregateVersion'>

const saveOneEvent = async (event: ImportedEvent) =>
  await api.invokeImportApi({
    ...event,
    aggregateVersion: aggregateVersionsMap
      .set(
        event.aggregateId,
        aggregateVersionsMap.has(event.aggregateId)
          ? aggregateVersionsMap.get(event.aggregateId) + 1
          : 1
      )
      .get(event.aggregateId),
    timestamp: eventTimestamp++,
  })

const generateUserEvents = async (name: string) => {
  const aggregateId = uuid()

  await saveOneEvent({
    type: USER_CREATED,
    aggregateId,
    payload: { name },
  })
  await api.invokeImportSecretApi({
    id: aggregateId,
    secret: aggregateId + Date.now().toString(),
  })

  users[name] = aggregateId
  return aggregateId
}

const getUserId = async (userName: string) => {
  const user = users[userName]

  if (user) {
    return user
  }

  const aggregateId = await generateUserEvents(userName)
  users[userName] = aggregateId
  return aggregateId
}

const generateCommentEvents = async (
  comment: { by: string; text?: string },
  aggregateId: string,
  parentId: string
): Promise<string> => {
  const userName = comment.by
  const userId = await getUserId(userName)
  const commentId = uuid()

  await saveOneEvent({
    type: COMMENT_CREATED,
    aggregateId,
    payload: {
      commentId,
      parentCommentId: parentId != null ? parentId : null,
      authorId: userId,
      content: {
        text: comment.text || '',
        userId,
        userName,
        parentId: parentId,
      },
    },
  })

  return commentId
}

async function generateComments(
  ids: string[],
  aggregateId: string,
  parentId: string,
  options: any
): Promise<any> {
  if (options.count-- <= 0) {
    return Promise.resolve()
  }
  const comments = (await api.fetchItems(ids)) as Array<{
    kids: any
    by: string
  }>
  const promises = []
  for (const comment of comments) {
    if (!comment || !comment.by) {
      continue
    }
    if (options.count-- <= 0) {
      break
    }

    promises.push(
      generateCommentEvents(comment, aggregateId, parentId).then(
        (commentId) => {
          if (Array.isArray(comment.kids)) {
            return generateComments(
              comment.kids,
              aggregateId,
              commentId,
              options
            )
          }
        }
      )
    )
  }
  return await Promise.all(promises)
}

const generatePointEvents = async (aggregateId: string, pointCount: number) => {
  const keys = Object.keys(users)
  const count = Math.min(keys.length, pointCount)

  for (let i = 0; i < count; i++) {
    await saveOneEvent({
      type: STORY_UPVOTED,
      aggregateId,
      payload: {
        userId: users[keys[i]],
      },
    })
  }
}

const generateStoryEvents = async (story: any) => {
  if (!story || !story.by) {
    return
  }

  const userName = story.by || 'anonymous'
  const aggregateId = uuid()

  await saveOneEvent({
    type: STORY_CREATED,
    aggregateId,
    payload: {
      title: story.title || '',
      text: story.text || '',
      userId: await getUserId(userName),
      userName,
      link: story.url || '',
    },
  })

  if (story.score) {
    await generatePointEvents(aggregateId, story.score)
  }

  if (story.kids) {
    await generateComments(story.kids, aggregateId, null, {
      count: Math.floor(Math.random() * 100),
    })
  }

  return aggregateId
}

const getUniqueStoryIds = async (categories: any[]): Promise<any[]> => {
  const result = new Set()

  for (const ids of categories) {
    if (Array.isArray(ids)) {
      ids.forEach((id) => result.add(id))
    }
  }

  return [...result]
}

const fetchStoryIds = async () => {
  const categories = await Promise.all(
    ['topstories', 'newstories', 'showstories', 'askstories'].map((category) =>
      api.fetchStoryIds(category)
    )
  )

  return await getUniqueStoryIds(categories)
}

const fetchStories = async (ids: string[], tickCallback: () => any) => {
  const stories = await api.fetchItems(ids)

  const storiesSlice: any[] = []
  for (let sliceIndex = 0; sliceIndex < stories.length / 20; sliceIndex++) {
    storiesSlice[sliceIndex] = []
    for (let index = 0; index < 20; index++) {
      const story = stories[+(sliceIndex * 20) + index]
      if (story) {
        storiesSlice[sliceIndex][index] = story
      }
    }
  }

  for (const storySlice of storiesSlice) {
    const promises = []
    for (const story of storySlice) {
      promises.push(
        (async () => {
          if (!(story && !story.deleted && story.by)) {
            return
          }

          await generateStoryEvents(story)

          tickCallback()
        })()
      )
    }

    await Promise.all(promises)
  }
}

export const start = async (
  countCallback: (count: number) => any,
  tickCallback: () => any
): Promise<void> => {
  try {
    const storyIds = await fetchStoryIds()
    countCallback(storyIds.length)
    await fetchStories(storyIds, tickCallback)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(EOL)
    // eslint-disable-next-line no-console
    console.error(error)
    process.exit(1)
  }

  return null
}
