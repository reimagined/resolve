import React from 'react'
import { Redirect } from 'react-router-dom'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'

import Comment from '../components/Comment'
import Pagination from '../components/Pagination'
import { ITEMS_PER_PAGE } from '../constants'

export const CommentsByPage = ({ comments, paginationDone, page }) =>
  page && !Number.isInteger(Number(page)) ? (
    <Redirect push to={`/error?text=No such page`} />
  ) : (
    <div>
      {comments.map(comment => (
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
      <Pagination page={page} hasNext={!paginationDone} location="/comments" />
    </div>
  )

const mapStateToOptions = (
  state,
  {
    match: {
      params: { page }
    }
  }
) => ({
  readModelName: 'Comments',
  resolverName: 'allCommentsPaginate',
  resolverArgs: {
    itemsOnPage: ITEMS_PER_PAGE,
    pageNumber: +page - 1
  }
})

const mapStateToProps = (
  state,
  {
    match: {
      params: { page }
    },
    data
  }
) => ({
  comments: data.comments.map(({ childCommentId, ...rest }) => ({
    commentId: childCommentId,
    ...rest
  })),
  paginationDone: data.paginationDone,
  page
})

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps)(CommentsByPage)
)
