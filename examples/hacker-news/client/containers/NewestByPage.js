import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'

import Stories from '../components/Stories'
import { ITEMS_PER_PAGE } from '../constants'

// TODO remove
import { createActions } from 'resolve-redux'
import userCommands from '../../common/aggregates/user.commands'
import storyCommands from '../../common/aggregates/story.commands'
const aggregateActions = {
  ...createActions({
    name: 'user',
    commands: userCommands
  }),
  ...createActions({
    name: 'story',
    commands: storyCommands
  })
}

const NewestByPage = ({ page, stories, me, upvoteStory, unvoteStory }) => (
  <Stories
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
  readModelName: 'default',
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
    data
  }
) => ({
  stories: data,
  page,
  me: state.jwt
})

export const mapDispatchToProps = dispatch =>
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
  )(NewestByPage)
)
