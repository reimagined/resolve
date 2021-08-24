import { defaults as commentsModule } from '@resolve-js/module-comments'
import { v4 as uuid } from 'uuid'
import { EOL } from 'os'
import {
  USER_CREATED,
  STORY_CREATED,
  STORY_UPVOTED,
} from '../common/event-types'
import api from './api'
const { COMMENT_CREATED } = commentsModule
const aggregateVersionsMap = new Map()
let eventTimestamp = Date.now()
const users = {}
const saveOneEvent = async (event) =>
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
const generateUserEvents = async (name) => {
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
const getUserId = async (userName) => {
  const user = users[userName]
  if (user) {
    return user
  }
  const aggregateId = await generateUserEvents(userName)
  users[userName] = aggregateId
  return aggregateId
}
const generateCommentEvents = async (comment, aggregateId, parentId) => {
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
async function generateComments(ids, aggregateId, parentId, options) {
  if (options.count-- <= 0) {
    return Promise.resolve()
  }
  const comments = await api.fetchItems(ids)
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
const generatePointEvents = async (aggregateId, pointCount) => {
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
const generateStoryEvents = async (story) => {
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
const getUniqueStoryIds = async (categories) => {
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
const fetchStories = async (ids, tickCallback) => {
  const stories = await api.fetchItems(ids)
  const storiesSlice = []
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
export const start = async (countCallback, tickCallback) => {
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
