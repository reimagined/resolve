import React from 'react'
import { connect } from 'react-redux'
import { RefreshHelperRenderless } from 'resolve-module-comments'

import ConnectedStory from './ConnectedStory'
import ConnectedComments from './ConnectedComments'
import CommentsNotification from '../components/CommentsNotification'

export class StoryById extends React.PureComponent {
  render() {
    const {
      match: {
        params: { storyId }
      },
      authorId
    } = this.props

    if (!storyId) {
      return null
    }

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
}

export const mapStateToProps = ({ jwt }) => ({
  authorId: jwt.id
})

export default connect(mapStateToProps)(StoryById)
