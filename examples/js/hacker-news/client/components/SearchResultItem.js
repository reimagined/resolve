import React from 'react'
import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
const Link = styled(NavLink)`
  display: block;
  padding: 6px;

  &:hover {
    background-color: silver;
    color: black;
  }

  &.active {
    font-weight: bold;
    text-decoration: underline;
  }
`
const SearchResultItem = ({
  data: { type, aggregateId, text },
  onNavigate,
}) => {
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
export { SearchResultItem }
