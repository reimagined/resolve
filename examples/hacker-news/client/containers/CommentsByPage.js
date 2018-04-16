import React from 'react'
import { Redirect } from 'react-router-dom'
import { connectReadModel } from 'resolve-redux'

import Comment from '../components/Comment'
import { ITEMS_PER_PAGE } from '../constants'
import Pagination from '../components/Pagination'

export const CommentsByPage = ({
  data: { comments = [] },
  match: { params: { page } }
}) =>
  page && !Number.isInteger(Number(page)) ? (
    <Redirect push to={`/error?text=No such page`} />
  ) : (
    <div>
      {comments
        .slice(0, ITEMS_PER_PAGE)
        .map(comment => <Comment key={comment.id} {...comment} />)}
      <Pagination
        page={page}
        hasNext={!!comments[ITEMS_PER_PAGE]}
        location="/comments"
      />
    </div>
  )

const getReadModelData = state => {
  try {
    return {
      comments: state.readModels['default']['comments'].comments,
      me: state.readModels['default']['comments'].me
    }
  } catch (err) {
    return { comments: [], me: null }
  }
}

export default connectReadModel((state, { match: { params: { page } } }) => ({
  readModelName: 'default',
  resolverName: 'comments',
  parameters: {
    offset: ITEMS_PER_PAGE + 1,
    first: (+page - 1) * ITEMS_PER_PAGE
  },
  data: getReadModelData(state),
  page
}))(CommentsByPage)
