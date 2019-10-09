import React from 'react'
import { connect } from 'react-redux'
import { connectReadModel } from 'resolve-redux'

export class CommentCountUpdater extends React.PureComponent {
  componentDidUpdate(prevProps) {
    if (this.props.commentCount != null && prevProps.commentCount == null) {
      this.props.updateCommentCount(this.props.commentCount)
    }
  }

  render() {
    return null
  }
}

export const mapStateToOptions = (
  state,
  { readModelName, resolverName, treeId, parentCommentId, authorId, timestamp }
) => ({
  readModelName,
  resolverName,
  resolverArgs: {
    authorId,
    treeId,
    parentCommentId,
    timestamp
  }
})

export const mapStateToProps = (state, { data }) => ({
  commentCount: data
})

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps)(CommentCountUpdater)
)
