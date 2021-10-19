import React from 'react'
import { useSelector } from 'react-redux'
import { RefreshHelperRenderless } from '@resolve-js/module-comments'
import { ConnectedComments } from './ConnectedComments'
import { CommentsNotification } from '../components/CommentsNotification'
const CommentsTreeById = ({
  match: {
    params: { storyId, commentId },
  },
}) => {
  const authorId = useSelector((state) => (state.jwt ? state.jwt.id : null))
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
export { CommentsTreeById }
