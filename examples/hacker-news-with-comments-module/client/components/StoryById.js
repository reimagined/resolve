import React from 'react'

import ConnectedStory from '../containers/ConnectedStory'
import ConnectedComments from '../containers/ConnectedComments'

export class StoryById extends React.PureComponent {
  render() {
    const {
      match: {
        params: { storyId }
      }
    } = this.props

    if (!storyId) {
      return null
    }

    return (
      <div>
        <ConnectedStory id={storyId} />
        <ConnectedComments treeId={storyId} />
      </div>
    )
  }
}

export default StoryById
