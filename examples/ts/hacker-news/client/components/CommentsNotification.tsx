import React from 'react'
import styled from 'styled-components'
import { CommentsNotificationRenderless } from '@resolve-js/module-comments'

const Container = styled.div`
  text-align: center;
  background-color: rgba(57, 73, 171, 0.75);
  margin-bottom: 10px;
  cursor: pointer;
`

const Notification = styled.div`
  display: inline-block;
  text-align: left;
  padding: 15px;
  color: #ffffff;
`
type CommentsNotificationProps = {
  treeId: string
  authorId: string
  parentCommentId?: string | null
  onClick: () => any
}

const CommentsNotification = ({
  treeId,
  authorId,
  parentCommentId = null,
  ...props
}: CommentsNotificationProps) => {
  if (!treeId || !authorId) {
    return null
  }

  return (
    <CommentsNotificationRenderless
      treeId={treeId}
      parentCommentId={parentCommentId}
      authorId={authorId}
      checkInterval={10000}
      {...props}
    >
      {({ count, onClick }: { count: number; onClick: () => any }) =>
        count !== 0 ? (
          <Container onClick={onClick}>
            <Notification>
              Comments had been updated - refresh page to see them
            </Notification>
          </Container>
        ) : null
      }
    </CommentsNotificationRenderless>
  )
}

export { CommentsNotification }
