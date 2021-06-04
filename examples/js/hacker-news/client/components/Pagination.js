import React from 'react'
import styled, { css } from 'styled-components'
import { NavLink } from 'react-router-dom'
import { Splitter } from './Splitter'
export const PaginationRoot = styled.div`
  padding: 0.5em 0;
`
export const StyledLink = styled(NavLink)`
  display: inline;
  font-weight: bold;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  ${(props) =>
    props.disabled
      ? css`
          pointer-events: none;
          cursor: default;
          color: gray;
        `
      : css`
          color: #000;
        `};
`
const Pagination = ({ page = 1, hasNext, location }) => {
  if (page === 1 && !hasNext) {
    return null
  }
  const prevDisabled = page <= 1
  const nextDisabled = !hasNext
  return React.createElement(
    PaginationRoot,
    null,
    React.createElement(
      StyledLink,
      { to: `${location}/${Number(page) - 1}`, disabled: prevDisabled },
      'Prev'
    ),
    React.createElement(Splitter, null),
    page,
    React.createElement(Splitter, null),
    React.createElement(
      StyledLink,
      { to: `${location}/${Number(page) + 1}`, disabled: nextDisabled },
      'More'
    )
  )
}
export { Pagination }
