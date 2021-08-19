import React, { useRef, useCallback } from 'react'
import styled from 'styled-components'
import { v4 as uuid } from 'uuid'
import { useSelector } from 'react-redux'
import { CommentsTreeRenderless } from '@resolve-js/module-comments'
import { ChildComments } from '../components/ChildComments'
import { Comment } from '../components/Comment'
import { StoreState, UserState } from '../../types'

const Reply = styled.div`
  padding: 0.5em;
  margin-bottom: 1em;
`
type ConnectedCommentsProps = {
  treeId: string
  authorId: string
  parentCommentId?: string
}

const ConnectedComments = ({
  treeId,
  authorId,
  parentCommentId = undefined,
}: ConnectedCommentsProps) => {
  const comment = useRef<any>()

  const me = useSelector<StoreState, UserState>((state) => state.jwt)

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
      {({
        comments,
        createComment,
      }: {
        comments: any
        createComment: (...args: any[]) => any
      }) => {
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
