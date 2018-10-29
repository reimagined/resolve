import React from 'react'
import { bindActionCreators } from 'redux'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'

import Stories from '../components/Stories'
import { ITEMS_PER_PAGE } from '../constants'

const ShowByPage = ({ page, stories, me, upvoteStory, unvoteStory }) => (
  <Stories
    items={stories}
    page={page}
    type="show"
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
  resolverName: 'showStories',
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
    data
  }
) => ({
  stories: data,
  page,
  me: state.jwt
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(
    {
      upvoteStory: aggregateActions.upvoteStory,
      unvoteStory: aggregateActions.unvoteStory
    },
    dispatch
  )

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ShowByPage)
)
