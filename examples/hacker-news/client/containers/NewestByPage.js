import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { connectReadModel, sendAggregateAction } from 'resolve-redux'

import Stories from '../components/Stories'
import { ITEMS_PER_PAGE } from '../constants'

const NewestByPage = ({
  isLoading,
  page,
  stories,
  me,
  upvoteStory,
  unvoteStory
}) => (
  <Stories
    isLoading={isLoading}
    items={stories}
    page={page || '1'}
    type="newest"
    userId={me && me.id}
    upvoteStory={upvoteStory}
    unvoteStory={unvoteStory}
  />
)

export const mapStateToOptions = (
  state,
  {
    match: {
      params: { page }
    }
  }
) => ({
  readModelName: 'HackerNews',
  resolverName: 'allStories',
  resolverArgs: {
    offset: ITEMS_PER_PAGE + 1,
    first: (+page - 1) * ITEMS_PER_PAGE
  }
})

export const mapStateToProps = (
  state,
  {
    match: {
      params: { page }
    },
    data,
    isLoading
  }
) => ({
  stories: data,
  isLoading,
  page,
  me: state.jwt
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      upvoteStory: sendAggregateAction.bind(null, 'Story', 'upvoteStory'),
      unvoteStory: sendAggregateAction.bind(null, 'Story', 'unvoteStory')
    },
    dispatch
  )

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(NewestByPage)
)
