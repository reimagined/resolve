import React from 'react'
import { bindActionCreators } from 'redux'
import uuid from 'uuid/v4'
import { connectViewModel, connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'
import styled from 'styled-components'

import CommentsUpdatesNotification from '../components/CommentsUpdatesNotification'
import Story from '../containers/Story'
import ChildrenComments from '../components/ChildrenComments'

import commentActions from '../actions/comments_actions'

const Reply = styled.div`
  padding: 0.5em;
  margin-bottom: 1em;
`

export class StoryDetails extends React.PureComponent {
  saveComment = () => {
    const { commentId, storyId, me } = this.props

    this.props.createComment(storyId, {
      commentId: uuid.v4(),
      parentCommentId: null,
      content: {
        text: this.textarea.value,
        createdBy: me.id,
        createdByName: me.name,
        createdAt: new Date(),
        parentId: null
      }
    })

    this.textarea.value = ''
  }

  storedLastCommentSerial = null

  render() {
    const { me, story, upvoteStory, commentsTree, unvoteStory } = this.props
    const loggedIn = !!me.id

    if (!story) {
      return null
    }

    let showUpdateNotification = false
    const lastCommentSerial = story.lastCommentSerial
    if (lastCommentSerial !== this.storedLastCommentSerial) {
      if (this.storedLastCommentSerial != null) {
        showUpdateNotification = true
      }
      this.storedLastCommentSerial = lastCommentSerial
    }

    return (
      <div>
        {showUpdateNotification && <CommentsUpdatesNotification />}
        <Story
          showText
          story={story}
          userId={me && me.id}
          upvoteStory={upvoteStory}
          unvoteStory={unvoteStory}
        />
        {loggedIn ? (
          <Reply>
            <textarea
              ref={element => (this.textarea = element)}
              name="text"
              rows="6"
            />
            <div>
              <button onClick={this.saveComment}>add comment</button>
            </div>
          </Reply>
        ) : null}
        <ChildrenComments
          storyId={story.id}
          comments={commentsTree.children}
          loggedIn={loggedIn}
        />
      </div>
    )
  }
}

const mapStateToOptionsReadModel = (
  state,
  {
    match: {
      params: { storyId }
    }
  }
) => ({
  readModelName: 'HackernewsComments',
  resolverName: 'ReadCommentsTree',
  resolverArgs: {
    treeId: storyId,
    parentCommentId: null
  }
})

const mapStateToPropsReadModel = (
  state,
  {
    match: {
      params: { storyId, commentId }
    },
    data
  }
) => ({
  commentsTree: data,
  storyId,
  commentId
})

const mapStateToOptionsViewModel = (
  state,
  {
    match: {
      params: { storyId }
    }
  }
) => ({
  viewModelName: 'storyDetails',
  aggregateIds: [storyId],
  aggregateArgs: {}
})

const mapStateToPropsViewModel = (state, { data }) => ({
  story: data,
  me: state.jwt
})

const mapDispatchToPropsViewModel = (dispatch, { aggregateActions }) =>
  bindActionCreators(
    {
      upvoteStory: aggregateActions.upvoteStory,
      unvoteStory: aggregateActions.unvoteStory,
      ...commentActions
    },
    dispatch
  )

const ConnectedStoryDetailsViewModel = connectViewModel(
  mapStateToOptionsViewModel
)(
  connect(
    mapStateToPropsViewModel,
    mapDispatchToPropsViewModel
  )(StoryDetails)
)

const ConnectedStoryDetailsReadModel = connectReadModel(
  mapStateToOptionsReadModel
)(connect(mapStateToPropsReadModel)(ConnectedStoryDetailsViewModel))

export default ConnectedStoryDetailsReadModel
