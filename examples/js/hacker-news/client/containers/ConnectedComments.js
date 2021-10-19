import React, { useRef, useCallback } from 'react'
import styled from 'styled-components'
import { v4 as uuid } from 'uuid'
import { useSelector } from 'react-redux'
import { CommentsTreeRenderless } from '@resolve-js/module-comments'
import { ChildComments } from '../components/ChildComments'
import { Comment } from '../components/Comment'
const Reply = styled.div`
  padding: 0.5em;
  margin-bottom: 1em;
`
const ConnectedComments = ({
  treeId,
  authorId,
  parentCommentId = undefined,
}) => {
  const comment = useRef()
  const me = useSelector((state) => state.jwt)
  const addComment = useCallback(
    (createComment) => {
      createComment(treeId, {
        commentId: uuid(),
        authorId: me.id,
        parentCommentId,
        content: {
          text: comment.current.value,
          createdBy: me.id,
          createdByName: me.name,
          createdAt: Date.now(),
        },
      })
      comment.current.value = ''
    },
    [me]
  )
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
                <textarea ref={comment} rows={6} />
                <div>
                  <button onClick={() => addComment(createComment)}>
                    add comment
                  </button>
                </div>
              </Reply>
            ) : null}
            <ChildComments
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
export { ConnectedComments }
