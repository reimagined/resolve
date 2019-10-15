import React from 'react'
import { bindActionCreators } from 'redux'
import { connectReadModel, sendAggregateAction } from 'resolve-redux'
import { connect } from 'react-redux'

import * as defaults from '../../common/defaults'

export class CommentsTreeRenderless extends React.PureComponent {
  static defaultProps = {
    children: ({ comments }) => {
      // eslint-disable-next-line
      console.log('comments:', comments)
      return null
    }
  }

  render() {
    const { children: Component, comments, ...props } = this.props
    return <Component {...props} comments={comments} />
  }
}

export const mapStateToOptions = (
  state,
  {
    readModelName = defaults.readModelName,
    resolverName = defaults.commentsTree,
    treeId,
    parentCommentId,
    authorId
  }
) => ({
  readModelName,
  resolverName,
  resolverArgs: {
    authorId,
    treeId,
    parentCommentId
  }
})

export const mapStateToProps = (
  state,
  { treeId, parentCommentId, reducerName = defaults.reducerName }
) => ({
  comments: [reducerName, treeId, parentCommentId].reduce(
    (result, partName) => (result ? result[partName] : result),
    state
  )
})

export const mapDispatchToProps = (
  dispatch,
  {
    aggregateName = defaults.aggregateName,
    createComment = defaults.createComment,
    updateComment = defaults.updateComment,
    removeComment = defaults.removeComment
  }
) =>
  bindActionCreators(
    {
      [createComment]: sendAggregateAction.bind(
        null,
        aggregateName,
        createComment
      ),
      [updateComment]: sendAggregateAction.bind(
        null,
        aggregateName,
        updateComment
      ),
      [removeComment]: sendAggregateAction.bind(
        null,
        aggregateName,
        removeComment
      )
    },
    dispatch
  )

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(CommentsTreeRenderless)
)
