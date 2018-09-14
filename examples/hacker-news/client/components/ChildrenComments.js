import React from 'react'
import styled from 'styled-components'

import Comment from './Comment'
import ReplyLink from './ReplyLink'

const ChildrenCommentsContainer = styled.div`
  margin-left: 2em;
  margin-top: 1em;
`

const ChildrenComments = ({ storyId, parentId, comments, loggedIn }) => {
  if (!comments || !comments.length) {
    return null
  }

  return (
    <div>
      {comments.map(comment => {
        if (comment.parentId !== parentId) {
          return null
        }
        return (
          <Comment key={comment.id} storyId={storyId} {...comment}>
            {loggedIn ? (
              <ReplyLink storyId={storyId} commentId={comment.id} />
            ) : null}
            <ChildrenCommentsContainer>
              <ChildrenComments
                storyId={storyId}
                comments={comments}
                parentId={comment.id}
                loggedIn={loggedIn}
              />
            </ChildrenCommentsContainer>
          </Comment>
        )
      })}
    </div>
  )
}

export default ChildrenComments
