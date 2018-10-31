import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'

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
  comments: state[reducerName][treeId][parentCommentId]
})

export const mapDispatchToProps = (dispatch, { aggregateActions }) =>
  bindActionCreators(aggregateActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(CommentsTreeRenderless)
)
