import React from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { RefreshHelperRenderless } from '@resolve-js/module-comments'

import { ConnectedComments } from './ConnectedComments'
import { CommentsNotification } from '../components/CommentsNotification'
import { StoreState } from '../../types'

const CommentsTreeById = () => {
  let { storyId } = useParams<'storyId'>()
  let { commentId } = useParams<'commentId'>()

  const authorId = useSelector<StoreState, string>((state) =>
    state.jwt ? state.jwt.id : null
  )

  return (
    <RefreshHelperRenderless>
      {({ refresh, refreshId }: { refreshId: string; refresh: () => any }) => (
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
