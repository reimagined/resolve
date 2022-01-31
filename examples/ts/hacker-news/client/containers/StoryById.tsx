import React from 'react'
import { useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { RefreshHelperRenderless } from '@resolve-js/module-comments'

import type { StoreState } from '../../types'
import { ConnectedStory } from './ConnectedStory'
import { ConnectedComments } from './ConnectedComments'
import { CommentsNotification } from '../components/CommentsNotification'

const StoryById = () => {
  let { storyId } = useParams<'storyId'>()

  if (!storyId) {
    return null
  }
  const authorId = useSelector<StoreState, string>((state) =>
    state.jwt ? state.jwt.id : null
  )

  return (
    <RefreshHelperRenderless>
      {({ refresh, refreshId }: { refreshId: string; refresh: () => any }) => (
        <div>
          <CommentsNotification
            treeId={storyId}
            authorId={authorId}
            onClick={refresh}
          />
          <ConnectedStory id={storyId} />
          <ConnectedComments
            key={refreshId}
            treeId={storyId}
            authorId={authorId}
          />
        </div>
      )}
    </RefreshHelperRenderless>
  )
}

export { StoryById }
