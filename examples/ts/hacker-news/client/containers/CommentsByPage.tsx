import React from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { CommentsPaginateRenderless } from '@resolve-js/module-comments'

import { Comment } from '../components/Comment'
import { Pagination } from '../components/Pagination'
import { ITEMS_PER_PAGE } from '../constants'

const CommentsByPage = () => {
  let { page } = useParams<'page'>()

  return page && !Number.isInteger(Number(page)) ? (
    <Navigate to={`/error?text=No such page`} />
  ) : (
    <CommentsPaginateRenderless
      itemsOnPage={ITEMS_PER_PAGE}
      pageNumber={+page || 1}
    >
      {({
        comments,
        paginationDone,
      }: {
        comments: any[]
        paginationDone: boolean
      }) => (
        <div>
          {comments &&
            comments.map((comment: any) => (
              <Comment
                key={comment.commentId}
                id={comment.commentId}
                storyId={comment.treeId}
                text={comment.content.text}
                createdBy={comment.content.createdBy}
                createdByName={comment.content.createdByName}
                createdAt={comment.content.createdAt}
                parentId={comment.content.parentId}
              />
            ))}
          <Pagination
            page={page}
            hasNext={!paginationDone}
            location="/comments"
          />
        </div>
      )}
    </CommentsPaginateRenderless>
  )
}

export { CommentsByPage }
