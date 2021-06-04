import React from 'react'
import styled from 'styled-components'
import { Comment } from './Comment'
import { ReplyLink } from './ReplyLink'
const ChildrenCommentsContainer = styled.div`
  margin-left: 2em;
  margin-top: 1em;
`
const ChildComments = ({ storyId, comments, loggedIn }) => {
  if (!comments || !comments.length) {
    return null
  }
  return React.createElement(
    'div',
    null,
    comments.map((comment) => {
      if (comment == null) {
        return null
      }
      return React.createElement(
        Comment,
        {
          key: comment.commentId,
          id: comment.commentId,
          storyId: storyId,
          ...comment.content,
        },
        loggedIn
          ? React.createElement(ReplyLink, {
              storyId: storyId,
              commentId: comment.commentId,
            })
          : null,
        React.createElement(
          ChildrenCommentsContainer,
          null,
          React.createElement(ChildComments, {
            storyId: storyId,
            comments: comment.children,
            loggedIn: loggedIn,
          })
        )
      )
    })
  )
}
export { ChildComments }
