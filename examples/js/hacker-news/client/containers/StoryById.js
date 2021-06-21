import React from 'react'
import { useSelector } from 'react-redux'
import { RefreshHelperRenderless } from '@resolve-js/module-comments'
import { ConnectedStory } from './ConnectedStory'
import { ConnectedComments } from './ConnectedComments'
import { CommentsNotification } from '../components/CommentsNotification'
const StoryById = ({
  match: {
    params: { storyId },
  },
}) => {
  if (!storyId) {
    return null
  }
  const authorId = useSelector((state) => (state.jwt ? state.jwt.id : null))
  return (
    <RefreshHelperRenderless>
      {({ refresh, refreshId }) => (
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
