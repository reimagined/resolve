import { ReadModelResolvers } from '@resolve-js/core'
import { ResolveStore } from '@resolve-js/readmodel-base'
import { GetStoriesParams } from '../../types'

const getStories = async (
  type: string | null,
  store: ResolveStore,
  { first, offset }: { first: number; offset: number }
) => {
  const search = type && type.constructor === String ? { type } : {}
  const skip = first || 0
  const stories = await store.find(
    'Stories',
    search,
    null,
    { createdAt: -1 },
    skip,
    offset
  )

  return Array.isArray(stories) ? stories : []
}

const getStory = async (store: ResolveStore, { id }: { id: string }) => {
  const story = await store.findOne('Stories', { id })

  if (!story) {
    return null
  }

  const type = !story.link
    ? 'ask'
    : /^(Show HN)/.test(story.title)
    ? 'show'
    : 'story'

  Object.assign(story, { type })

  return story
}

const getUser = async (
  store: ResolveStore,
  {
    id,
    name,
  }: {
    id: string
    name: string
  }
) => {
  const user =
    name != null
      ? await store.findOne('Users', { name })
      : id != null
      ? await store.findOne('Users', { id })
      : null

  return user
}

const hackerNewsResolvers: ReadModelResolvers<ResolveStore> = {
  story: getStory,
  allStories: (store, params: GetStoriesParams) =>
    getStories(null, store, params),
  askStories: (store, params: GetStoriesParams) =>
    getStories.bind('ask', store, params),
  showStories: (store, params: GetStoriesParams) =>
    getStories('show', store, params),
  user: getUser,
}

export default hackerNewsResolvers
