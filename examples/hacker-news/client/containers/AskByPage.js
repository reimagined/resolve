import React from 'react'
import { bindActionCreators } from 'redux'
import { connectReadModel } from 'resolve-redux'

import Stories from '../components/Stories'
import { ITEMS_PER_PAGE } from '../constants'

const AskByPage = ({
  match: {
    params: { page }
  },
  data: { stories = [], me },
  upvoteStory,
  unvoteStory
}) => (
  <Stories
    items={stories}
    page={page}
    type="ask"
    userId={me && me.id}
    upvoteStory={upvoteStory}
    unvoteStory={unvoteStory}
  />
)

const getReadModelData = state => {
  try {
    return {
      stories: state.readModels['default']['askStories'].stories,
      me: state.readModels['default']['askStories'].me
    }
  } catch (err) {
    return { stories: [], me: null }
  }
}

export default connectReadModel(
  (
    state,
    {
      match: {
        params: { page }
      }
    }
  ) => ({
    readModelName: 'default',
    resolverName: 'askStories',
    parameters: {
      offset: ITEMS_PER_PAGE + 1,
      first: (+page - 1) * ITEMS_PER_PAGE
    },
    data: getReadModelData(state),
    page
  }),
  (dispatch, { aggregateActions }) =>
    bindActionCreators(
      {
        upvoteStory: aggregateActions.upvoteStory,
        unvoteStory: aggregateActions.unvoteStory
      },
      dispatch
    )
)(AskByPage)
