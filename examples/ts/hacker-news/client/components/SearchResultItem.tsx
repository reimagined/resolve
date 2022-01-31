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
type SearchResultItemProps = {
  data: { type: string; aggregateId: string; text: string }
  onNavigate: () => any
}

const SearchResultItem = ({
  data: { type, aggregateId, text },
  onNavigate,
}: SearchResultItemProps) => {
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
