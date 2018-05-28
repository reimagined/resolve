import React from 'react'
import { connectReadModel } from 'resolve-redux'

import Stories from '../components/Stories'
import { ITEMS_PER_PAGE } from '../constants'

const NewestByPage = ({
  match: {
    params: { page }
  },
  data: { stories = [], me },
  upvoteStory,
  unvoteStory
}) => (
  <Stories
    items={stories}
    page={page || '1'}
    type="newest"
    userId={me && me.id}
    upvoteStory={upvoteStory}
    unvoteStory={unvoteStory}
  />
)

const getReadModelData = state => {
  try {
    return {
      stories: state.readModels['default']['allStories'].stories,
      me: state.readModels['default']['allStories'].me
    }
  } catch (err) {
    return { stories: [], me: null }
  }
}

export default connectReadModel((state, { aggregateActions, match: { params: { page } } }) => ({
  readModelName: 'default',
  resolverName: 'allStories',
  parameters: {
    offset: ITEMS_PER_PAGE + 1,
    first: (+page - 1) * ITEMS_PER_PAGE
  },
  data: getReadModelData(state),
  page,
  upvoteStory: aggregateActions.upvoteStory,
  unvoteStory: aggregateActions.unvoteStory
}))(NewestByPage)
