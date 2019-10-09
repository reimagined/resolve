import React from 'react'
import { connect } from 'react-redux'
import styled from 'styled-components'
import uuid from 'uuid/v4'
import { CommentsTreeRenderless } from 'resolve-module-comments'

import ChildrenComments from '../components/ChildrenComments'
import Comment from '../components/Comment'

const Reply = styled.div`
  padding: 0.5em;
  margin-bottom: 1em;
`

class ConnectedComments extends React.PureComponent {
  comment = React.createRef()

  onCreateComment = createComment => {
    const { treeId, parentCommentId, me } = this.props

    createComment(treeId, {
      commentId: uuid(),
      authorId: me.id,
      parentCommentId,
      content: {
        text: this.comment.current.value,
        createdBy: me.id,
        createdByName: me.name,
        createdAt: Date.now()
      }
    })

    this.comment.current.value = ''
  }

  updateCommentText = event =>
    this.setState({
      commentText: event.target.value
    })

  render() {
    const { treeId, parentCommentId, authorId, me } = this.props

    return (
      <CommentsTreeRenderless
        treeId={treeId}
        parentCommentId={parentCommentId}
        authorId={authorId}
      >
        {({ comments, createComment }) => {
          const loggedIn = !!me.id

          const content = (
            <div>
              {loggedIn ? (
                <Reply>
                  <textarea ref={this.comment} rows="6" />
                  <div>
                    <button
                      onClick={this.onCreateComment.bind(this, createComment)}
                    >
                      add comment
                    </button>
                  </div>
                </Reply>
              ) : null}
              <ChildrenComments
                storyId={treeId}
                comments={comments ? comments.children : null}
                loggedIn={loggedIn}
              />
            </div>
          )

          if (comments && comments.commentId) {
            return (
              <Comment
                storyId={treeId}
                id={comments.commentId}
                {...comments.content}
              >
                {content}
              </Comment>
            )
          } else {
            return <div>{content}</div>
          }
        }}
      </CommentsTreeRenderless>
    )
  }
}

const mapStateToProps = state => ({
  me: state.jwt
})

export default connect(mapStateToProps)(ConnectedComments)
