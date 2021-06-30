import React from 'react'
import sanitizer from 'sanitizer'
import styled, { css } from 'styled-components'
import { parse as parseUrl } from 'url'
import { useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import { Splitter } from '../components/Splitter'
import { TimeAgo } from '../components/TimeAgo'
import { useReduxCommand } from '@resolve-js/redux'
export const StoryRoot = styled.div`
  margin-bottom: 12px;
`
export const StoryText = styled.div`
  color: #000;
  font-size: 14px;
  padding-top: 15px;
  padding-left: 5px;
`
export const TitleRoot = styled.div`
  display: inline-block;
  color: #000;
  font-size: 8pt;
`
export const StyledLink = styled(NavLink)`
  font-size: 10pt;
`
export const StyledExternalLink = styled.a`
  font-size: 10pt;
`
export const StoryInfoRoot = styled.div`
  color: #666;
  font-size: 8pt;
`
const infoLinkStyles = `
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`
export const UnvoteLink = styled.span`
  ${infoLinkStyles};
`
export const DiscussLink = styled(NavLink)`
  ${infoLinkStyles};
`
export const UpvoteArrow = styled.div`
  display: inline-block;
  width: 0;
  height: 0;
  border-width: 4px;
  border-bottom-width: 7px;
  border-style: solid;
  border-color: transparent;
  margin-right: 5px;

  ${(props) =>
    !props.hidden &&
    css`
      border-bottom-color: #9a9a9a;
      cursor: pointer;
    `};
`
const Username = styled(NavLink)`
  display: inline-block;
  font-weight: bold;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`
const isExternalLink = (link) => link[0] !== '/'
export const getHostname = (link) => {
  return parseUrl(link).hostname
}
const Title = ({ title, link, upvoteStory, voted, loggedIn }) => {
  const isExternal = isExternalLink(link)
  return (
    <TitleRoot>
      {loggedIn ? (
        !voted ? (
          <UpvoteArrow onClick={upvoteStory} title="upvote" />
        ) : (
          <UpvoteArrow hidden />
        )
      ) : null}
      {isExternal ? (
        <StyledExternalLink href={link}>{title}</StyledExternalLink>
      ) : (
        <StyledLink to={link}>{title}</StyledLink>
      )}{' '}
      {isExternal ? `(${getHostname(link)})` : null}
    </TitleRoot>
  )
}
const StoryInfo = ({
  id,
  createdBy,
  createdByName,
  createdAt,
  votes,
  commentCount,
  voted,
  loggedIn,
  unvoteStory,
}) => {
  const unvoteIsVisible = voted && loggedIn
  return (
    <StoryInfoRoot>
      {votes ? `${votes.length} point(s) ` : null}
      {createdBy
        ? [
            'by ',
            <Username key="username" to={`/user/${createdBy}`}>
              {createdByName}
            </Username>,
            ' ',
          ]
        : null}
      <TimeAgo createdAt={createdAt} />
      {unvoteIsVisible && (
        <span>
          <Splitter />
          <UnvoteLink onClick={unvoteStory}>unvote</UnvoteLink>{' '}
        </span>
      )}
      <Splitter />
      <DiscussLink to={`/storyDetails/${id}`}>
        {commentCount > 0 ? `${commentCount} comment(s)` : 'discuss'}
      </DiscussLink>{' '}
    </StoryInfoRoot>
  )
}
const Story = ({ story, index = undefined, showText = false }) => {
  if (!story || !story.id) {
    return null
  }
  const { execute: upvoteStory } = useReduxCommand(
    {
      aggregateId: story.id,
      aggregateName: 'Story',
      type: 'upvoteStory',
    },
    [story.id]
  )
  const { execute: unvoteStory } = useReduxCommand(
    {
      aggregateId: story.id,
      aggregateName: 'Story',
      type: 'unvoteStory',
    },
    [story.id]
  )
  const optimistic = useSelector((state) => state.optimistic)
  const userId = useSelector((state) => (state.jwt ? state.jwt.id : null))
  const loggedIn = !!userId
  const voted =
    optimistic.votedStories[story.id] && story.votes.indexOf(userId) !== -1
  const votes = story.votes
    .filter((id) => id !== userId)
    .concat(voted ? [userId] : [])
  const commentCount = story.commentCount
  const title = `${index ? `${index}. ` : ''}${
    story.type === 'ask' ? `Ask HN: ${story.title}` : story.title
  }`
  return (
    <StoryRoot>
      <Title
        loggedIn={loggedIn}
        voted={voted}
        upvoteStory={upvoteStory}
        title={title}
        link={story.link || `/storyDetails/${story.id}`}
      />
      <StoryInfo
        voted={voted}
        id={story.id}
        votes={votes}
        commentCount={commentCount}
        unvoteStory={unvoteStory}
        loggedIn={loggedIn}
        createdAt={story.createdAt}
        createdBy={story.createdBy}
        createdByName={story.createdByName}
      />
      {story.text && showText ? (
        <StoryText
          dangerouslySetInnerHTML={{
            __html: sanitizer.sanitize(story.text),
          }}
        />
      ) : null}
    </StoryRoot>
  )
}
export { Story }
