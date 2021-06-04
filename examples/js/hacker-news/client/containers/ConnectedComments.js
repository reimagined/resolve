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
  return React.createElement(
    CommentsTreeRenderless,
    { treeId: treeId, parentCommentId: parentCommentId, authorId: authorId },
    ({ comments, createComment }) => {
      const loggedIn = !!me.id
      const content = React.createElement(
        'div',
        null,
        loggedIn
          ? React.createElement(
              Reply,
              null,
              React.createElement('textarea', { ref: comment, rows: 6 }),
              React.createElement(
                'div',
                null,
                React.createElement(
                  'button',
                  { onClick: () => addComment(createComment) },
                  'add comment'
                )
              )
            )
          : null,
        React.createElement(ChildComments, {
          storyId: treeId,
          comments: comments ? comments.children : null,
          loggedIn: loggedIn,
        })
      )
      if (comments && comments.commentId) {
        return React.createElement(
          Comment,
          { storyId: treeId, id: comments.commentId, ...comments.content },
          content
        )
      } else {
        return React.createElement('div', null, content)
      }
    }
  )
}
export { ConnectedComments }
