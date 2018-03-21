import React from 'react'
import { gqlConnector } from 'resolve-redux'

import Stories from '../components/Stories'
import { ITEMS_PER_PAGE } from '../constants'

const ShowByPage = ({
  match: { params: { page } },
  data: { stories = [], me }
}) => <Stories items={stories} page={page} type="show" userId={me && me.id} />

export default gqlConnector(
  `
    query($first: Int, $offset: Int!) {
      stories(type: "show", first: $first, offset: $offset) {
        id
        type
        title
        text
        link
        commentCount
        votes
        createdAt
        createdBy
        createdByName
      }
      me {
        id
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
)(ShowByPage)
