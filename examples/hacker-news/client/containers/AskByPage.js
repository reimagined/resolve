import React from 'react'
import { bindActionCreators } from 'redux'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'

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

const AskByPage = ({ page, stories, me, upvoteStory, unvoteStory }) => (
  <Stories
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
  readModelName: 'default',
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
    data
  }
) => ({
  page,
  stories: data,
  me: state.jwt
})

// TODO: magic aggregateActions
const mapDispatchToProps = dispatch =>
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
  )(AskByPage)
)
