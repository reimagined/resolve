import React from 'react'
import sanitizer from 'sanitizer'
import styled from 'styled-components'

import Splitter from './Splitter'
import TimeAgo from './TimeAgo'
import { NavLink } from 'react-router-dom'

const CommentRoot = styled.div`
  margin-bottom: 1em;
`

const CommentInfo = styled.div`
  color: #666;
  margin-bottom: 0.5em;
`

const Collapse = styled.div`
  display: inline-block;
  margin-right: 0.33em;
  cursor: pointer;
`

const linkStyles = `
  &:hover {
    text-decoration: underline;
  }
`

const StyledLink = styled(NavLink)`
  ${linkStyles};
`

const StyledUserLink = styled(NavLink)`
  ${linkStyles};
  font-weight: bold;
  padding-right: 3px;
`

class Comment extends React.PureComponent {
  state = {
    expanded: true
  }

  expand = () => this.setState({ expanded: !this.state.expanded })

  render() {
    const {
      id,
      storyId,
      text,
      createdBy,
      createdByName,
      createdAt,
      parentId,
      children
    } = this.props

    if (!id) {
      return null
    }

    const parent =
      parentId == null
        ? `/storyDetails/${storyId}`
        : `/storyDetails/${storyId}/comments/${parentId}`

    return (
      <CommentRoot>
        <CommentInfo>
          <Collapse onClick={this.expand} tabIndex="0">
            {'['}
            {this.state.expanded ? '−' : '+'}
            {']'}
          </Collapse>
          <StyledUserLink to={`/user/${createdBy}`}>
            {createdByName}
          </StyledUserLink>
          <TimeAgo createdAt={createdAt} />
          <Splitter />
          <StyledLink to={`/storyDetails/${storyId}/comments/${id}`}>
            link
          </StyledLink>
          <Splitter />
          <StyledLink to={parent}>parent</StyledLink>
        </CommentInfo>
        {this.state.expanded ? (
          <div
            dangerouslySetInnerHTML={{
              __html: sanitizer.sanitize(text)
            }}
          />
        ) : null}
        {this.state.expanded ? children : null}
      </CommentRoot>
    )
  }
}

export default Comment
