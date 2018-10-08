import React from 'react'

import ConnectedComments from '../containers/ConnectedComments'
import CommentsNotification from '../containers/CommentsNotification'

export class CommentsTreeById extends React.PureComponent {
  render() {
    const {
      match: {
        params: { storyId, commentId }
      }
    } = this.props

    if (!storyId || !commentId) {
      return null
    }

    return (
      <div>
        <CommentsNotification treeId={storyId} />
        <ConnectedComments treeId={storyId} parentCommentId={commentId} />
      </div>
    )
  }
}

export default CommentsTreeById
