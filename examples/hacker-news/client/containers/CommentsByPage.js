import React from 'react'
import { Redirect } from 'react-router-dom'
import { gqlConnector } from 'resolve-redux'

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

export default gqlConnector(
  `
    query($first: Int, $offset: Int!) {
      comments(first: $first, offset: $offset) {
        id
        parentId
        storyId
        text
        createdAt
        createdBy
        createdByName
      }
    }
  `,
  {
    options: ({ match: { params: { page } } }) => ({
      variables: {
        offset: ITEMS_PER_PAGE + 1,
        first: (+page - 1) * ITEMS_PER_PAGE
      },
      fetchPolicy: 'network-only'
    })
  }
)(CommentsByPage)
