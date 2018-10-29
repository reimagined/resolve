import React from 'react'
import { connect } from 'react-redux'
import { RefreshHelperRenderless } from 'resolve-module-comments'

import ConnectedComments from './ConnectedComments'
import CommentsNotification from '../components/CommentsNotification'

export class CommentsTreeById extends React.PureComponent {
  render() {
    const {
      match: {
        params: { storyId, commentId }
      },
      authorId
    } = this.props

    return (
      <RefreshHelperRenderless>
        {({ refresh, refreshId }) => (
          <div>
            <CommentsNotification
              treeId={storyId}
              parentCommentId={commentId}
              authorId={authorId}
              onClick={refresh}
            />
            <ConnectedComments
              key={refreshId}
              treeId={storyId}
              parentCommentId={commentId}
              authorId={authorId}
            />
          </div>
        )}
      </RefreshHelperRenderless>
    )
  }
}

export const mapStateToProps = ({ jwt }) => ({
  authorId: jwt.id
})

export default connect(mapStateToProps)(CommentsTreeById)
