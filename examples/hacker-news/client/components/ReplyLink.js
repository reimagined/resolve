import React from 'react'
import Link from '../containers/Link'
import styled from 'styled-components'

const StyledLink = styled(Link)`
  text-decoration: underline;
  margin-top: 0.33em;
  color: #000;
`

const ReplyLink = ({ storyId, commentId }) => (
  <StyledLink to={`/storyDetails/${storyId}/comments/${commentId}`}>
    reply
  </StyledLink>
)

export default ReplyLink
