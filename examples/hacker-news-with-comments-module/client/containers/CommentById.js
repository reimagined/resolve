import React from 'react'
import { bindActionCreators } from 'redux'
import { connectReadModel, connectViewModel } from 'resolve-redux'
import { connect } from 'react-redux'
import styled from 'styled-components'
import uuid from 'uuid'

import CommentsUpdatesNotification from '../components/CommentsUpdatesNotification'
import Comment from '../components/Comment'
import ChildrenComments from '../components/ChildrenComments'

import commentActions from '../actions/comments_actions'

const Reply = styled.div`
  padding: 0.5em;
  margin-bottom: 1em;
`

export class CommentById extends React.PureComponent {
  saveComment = () => {
    const { commentId, storyId, me } = this.props

    this.props.createComment(storyId, {
      commentId: uuid.v4(),
      parentCommentId: commentId,
      content: {
        text: this.textarea.value,
        createdBy: me.id,
        createdByName: me.name,
        createdAt: new Date(),
        parentId: commentId
      }
    })

    this.textarea.value = ''
  }

  storedLastCommentSerial = null

  render() {
    const { me, storyId, story, commentsTree } = this.props
    const loggedIn = !!me.id

    if (storyId == null || story == null || commentsTree == null) {
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
        <Comment
          id={commentsTree.commentId}
          storyId={storyId}
          {...commentsTree.content}
        >
          {loggedIn ? (
            <Reply>
              <textarea
                ref={element => (this.textarea = element)}
                name="text"
                rows="6"
                cols="70"
              />
              <div>
                <button onClick={this.saveComment}>reply</button>
              </div>
            </Reply>
          ) : null}
          <ChildrenComments
            storyId={storyId}
            comments={commentsTree.children}
            parentId={commentsTree.commentId}
            loggedIn={loggedIn}
          />
        </Comment>
      </div>
    )
  }
}

export const mapStateToOptionsReadModel = (
  state,
  {
    match: {
      params: { storyId, commentId }
    }
  }
) => ({
  readModelName: 'HackernewsComments',
  resolverName: 'ReadCommentsTree',
  resolverArgs: {
    treeId: storyId,
    parentCommentId: commentId
  }
})

export const mapStateToPropsReadModel = (
  state,
  {
    match: {
      params: { storyId, commentId }
    },
    data
  }
) => ({
  commentsTree: data,
  me: state.jwt,
  storyId,
  commentId
})

export const mapDispatchToPropsReadModel = dispatch =>
  bindActionCreators(commentActions, dispatch)

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

const ConnectedCommentByIdViewModel = connectViewModel(
  mapStateToOptionsViewModel
)(connect(mapStateToPropsViewModel)(CommentById))

const ConnectedCommentByIdReadModel = connectReadModel(
  mapStateToOptionsReadModel
)(
  connect(
    mapStateToPropsReadModel,
    mapDispatchToPropsReadModel
  )(ConnectedCommentByIdViewModel)
)

export default ConnectedCommentByIdReadModel
