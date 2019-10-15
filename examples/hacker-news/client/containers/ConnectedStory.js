import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { connectReadModel } from 'resolve-redux'

import * as aggregateActions from '../actions/aggregate-actions'
import Story from './Story'

class ConnectedStory extends React.PureComponent {
  render() {
    const { story, me, upvoteStory, unvoteStory } = this.props

    return (
      <Story
        showText
        story={story}
        userId={me && me.id}
        upvoteStory={upvoteStory}
        unvoteStory={unvoteStory}
      />
    )
  }
}

const mapStateToOptions = ({ optimistic: { refreshId } }, { id }) => ({
  readModelName: 'HackerNews',
  resolverName: 'story',
  resolverArgs: {
    refreshId,
    id
  }
})

const mapStateToProps = (state, { data }) => ({
  story: data,
  me: state.jwt
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ConnectedStory)
)
