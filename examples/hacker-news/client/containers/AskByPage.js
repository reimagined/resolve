import React from 'react'
import { bindActionCreators } from 'redux'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'

import * as aggregateActions from '../actions/aggregate-actions'
import Stories from '../components/Stories'
import { ITEMS_PER_PAGE } from '../constants'

const AskByPage = ({
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
    page={page}
    type="ask"
    userId={me && me.id}
    upvoteStory={upvoteStory}
    unvoteStory={unvoteStory}
  />
)

const mapStateToOptions = (
  state,
  {
    match: {
      params: { page }
    }
  }
) => ({
  readModelName: 'HackerNews',
  resolverName: 'askStories',
  resolverArgs: {
    offset: ITEMS_PER_PAGE + 1,
    first: (+page - 1) * ITEMS_PER_PAGE
  }
})

const mapStateToProps = (
  state,
  {
    match: {
      params: { page }
    },
    isLoading,
    data
  }
) => ({
  isLoading,
  page,
  stories: data,
  me: state.jwt
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(AskByPage)
)
