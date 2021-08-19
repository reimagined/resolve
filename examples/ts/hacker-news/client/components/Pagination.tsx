import React from 'react'
import styled, { css } from 'styled-components'
import { NavLink } from 'react-router-dom'
import { Splitter } from './Splitter'

export const PaginationRoot = styled.div`
  padding: 0.5em 0;
`

type StyledLinkProps = { disabled: boolean }

export const StyledLink = styled(NavLink)<StyledLinkProps>`
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

type PaginationProps = {
  page?: string
  hasNext: boolean
  location: string
}

const Pagination = ({ page = '1', hasNext, location }: PaginationProps) => {
  if (page === '1' && !hasNext) {
    return null
  }

  const prevDisabled = Number(page) <= 1
  const nextDisabled = !hasNext

  return (
    <PaginationRoot>
      <StyledLink
        to={`${location}/${Number(page) - 1}`}
        disabled={prevDisabled}
      >
        Prev
      </StyledLink>
      <Splitter />
      {page}
      <Splitter />
      <StyledLink
        to={`${location}/${Number(page) + 1}`}
        disabled={nextDisabled}
      >
        More
      </StyledLink>
    </PaginationRoot>
  )
}

export { Pagination }
