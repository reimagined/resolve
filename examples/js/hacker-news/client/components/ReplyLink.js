import React from 'react'
import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
const StyledLink = styled(NavLink)`
  text-decoration: underline;
  margin-top: 0.33em;
  color: #000;
`
const ReplyLink = ({ storyId, commentId }) => (
  <StyledLink to={`/storyDetails/${storyId}/comments/${commentId}`}>
    reply
  </StyledLink>
)
export { ReplyLink }
