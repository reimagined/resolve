import React from 'react'

import ConnectedComments from '../containers/ConnectedComments'

export class CommentById extends React.PureComponent {
  render() {
    const {
      match: {
        params: { storyId, commentId }
      }
    } = this.props

    if (!storyId || !commentId) {
      return null
    }

    return <ConnectedComments treeId={storyId} parentCommentId={commentId} />
  }
}

export default CommentById
