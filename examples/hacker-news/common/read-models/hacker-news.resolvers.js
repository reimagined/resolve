const getStories = async (type, store, { first, offset }) => {
  const segment = store.performanceTracer.getSegment()
  const subSegment = segment.addNewSubsegment('resolver')

  subSegment.addAnnotation('type', type)
  subSegment.addAnnotation('origin', 'hacker-news:getStories')

  try {
    const search = type && type.constructor === String ? { type } : {}
    const skip = first || 0
    const stories = await store.find(
      'Stories',
      search,
      null,
      { createdAt: -1 },
      skip,
      skip + offset
    )

    return Array.isArray(stories) ? stories : []
  } catch (error) {
    if (subSegment != null) {
      subSegment.addError(error)
    }
    throw error
  } finally {
    if (subSegment != null) {
      subSegment.close()
    }
  }
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

export default {
  story: getStory,

  allStories: getStories.bind(null, null),

  askStories: getStories.bind(null, 'ask'),

  showStories: getStories.bind(null, 'show'),

  user: getUser
}
