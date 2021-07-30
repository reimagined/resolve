import React from 'react'
import { Redirect } from 'react-router-dom'

import { Comment } from '../components/Comment'
import { Pagination } from '../components/Pagination'
import { CommentsPaginateRenderless } from '@resolve-js/module-comments'

import { ITEMS_PER_PAGE } from '../constants'
import { RouteComponentProps } from 'react-router'

type MatchParams = { page?: string }

const CommentsByPage = ({
  match: {
    params: { page },
  },
}: RouteComponentProps<MatchParams>) => {
  return page && !Number.isInteger(Number(page)) ? (
    <Redirect push to={`/error?text=No such page`} />
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
            page={+page}
            hasNext={!paginationDone}
            location="/comments"
          />
        </div>
      )}
    </CommentsPaginateRenderless>
  )
}

export { CommentsByPage }
