import React from 'react'
import styled from 'styled-components'

import { NavLink } from 'react-router-dom'

const Link = styled(NavLink)`
  display: block;
  padding: 0 6px 6px 6px;

  &.active {
    font-weight: bold;
    text-decoration: underline;
  }
`

const SearchResultItem = ({ data: { type, aggregateId, text }, onNavigate }) => {
  return (
    <Link
      onClick={onNavigate}
      key={aggregateId}
      to={
        type === 'user'
          ? `/user/${aggregateId}`
          : `/storyDetails/${aggregateId}`
      }
    >
      {`${type}: ${text}`}
    </Link>
  )
}

export default SearchResultItem
