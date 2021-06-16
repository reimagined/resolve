const getStories = async (type, store, { first, offset }) => {
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
const getStory = async (store, { id }) => {
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
const getUser = async (store, { id, name }) => {
  const user =
    name != null
      ? await store.findOne('Users', { name })
      : id != null
      ? await store.findOne('Users', { id })
      : null
  return user
}
const hackerNewsResolvers = {
  story: getStory,
  allStories: (store, params) => getStories(null, store, params),
  askStories: (store, params) => getStories.bind('ask', store, params),
  showStories: (store, params) => getStories('show', store, params),
  user: getUser,
}
export default hackerNewsResolvers
