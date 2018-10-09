import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { connectReadModel } from 'resolve-redux'
import styled from 'styled-components'
import uuid from 'uuid/v4'

import ChildrenComments from '../components/ChildrenComments'
import Comment from '../components/Comment'
import commentsActions from '../actions/comment-actions'

const Reply = styled.div`
  padding: 0.5em;
  margin-bottom: 1em;
`

class ConnectedComments extends React.PureComponent {
  state = {
    commentText: ''
  }

  saveComment = () => {
    const { treeId, parentCommentId = null, me, createComment } = this.props

    createComment(treeId, {
      commentId: uuid(),
      parentCommentId,
      content: {
        text: this.state.commentText,
        createdBy: me.id,
        createdByName: me.name,
        createdAt: Date.now(),
        parentId: null
      }
    })

    this.setState({
      commentText: ''
    })
  }

  updateCommentText = event => {
    this.setState({
      commentText: event.target.value
    })
  }

  render() {
    const { comments, treeId, me } = this.props

    const loggedIn = !!me.id

    const content = (
      <div>
        {loggedIn ? (
          <Reply>
            <textarea
              name="text"
              rows="6"
              value={this.state.commentText}
              onChange={this.updateCommentText}
            />
            <div>
              <button onClick={this.saveComment}>add comment</button>
            </div>
          </Reply>
        ) : null}
        <ChildrenComments
          storyId={treeId}
          comments={comments.children}
          loggedIn={loggedIn}
        />
      </div>
    )

    if (comments.commentId) {
      return (
        <Comment storyId={treeId} id={comments.commentId} {...comments.content}>
          {content}
        </Comment>
      )
    } else {
      return <div>{content}</div>
    }
  }
}

const mapStateToOptions = (
  { optimistic: { refreshId } },
  { treeId, parentCommentId = null }
) => ({
  readModelName: 'HackerNewsComments',
  resolverName: 'ReadCommentsTree',
  resolverArgs: {
    refreshId,
    treeId,
    parentCommentId
  }
})

const mapStateToProps = state => ({
  comments: state.optimistic.comments,
  me: state.jwt
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(commentsActions, dispatch)

export default connectReadModel(mapStateToOptions)(
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(ConnectedComments)
)
