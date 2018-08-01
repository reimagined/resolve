import React from 'react'
import { Redirect } from 'react-router-dom'
import { connectReadModel } from 'resolve-redux'
import { connect } from 'react-redux'

import Comment from '../components/Comment'
import Pagination from '../components/Pagination'
import { ITEMS_PER_PAGE } from '../constants'

export const CommentsByPage = ({ comments, page }) =>
  page && !Number.isInteger(Number(page)) ? (
    <Redirect push to={`/error?text=No such page`} />
  ) : (
    <div>
      {comments.slice(0, ITEMS_PER_PAGE).map(comment => (
        <Comment key={comment.id} {...comment} />
      ))}
      <Pagination
        page={page}
        hasNext={!!comments[ITEMS_PER_PAGE]}
        location="/comments"
      />
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
  readModelName: 'default',
  resolverName: 'comments',
  resolverArgs: {
    offset: ITEMS_PER_PAGE + 1,
    first: (+page - 1) * ITEMS_PER_PAGE
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
  comments: data,
  page
})

export default connectReadModel(mapStateToOptions)(
  connect(mapStateToProps)(CommentsByPage)
)
