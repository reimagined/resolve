import React from 'react'
import { useSelector } from 'react-redux'
import { RefreshHelperRenderless } from '@resolve-js/module-comments'

import { ConnectedStory } from './ConnectedStory'
import { ConnectedComments } from './ConnectedComments'
import { CommentsNotification } from '../components/CommentsNotification'
import { StoreState } from '../../types'

import { RouteComponentProps } from 'react-router'

type MatchParams = { storyId: string }

const StoryById = ({
  match: {
    params: { storyId },
  },
}: RouteComponentProps<MatchParams>) => {
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
