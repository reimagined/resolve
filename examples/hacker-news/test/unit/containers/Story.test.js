import React from 'react'
import { shallow } from 'enzyme'
import uuid from 'uuid'

import {
  getHostname,
  Title,
  StyledLink,
  UnvoteLink,
  StoryInfo,
  mapStateToProps,
  mapDispatchToProps,
  Story,
  UpvoteArrow
} from '../../../client/containers/Story'

import actions from '../../../client/actions/storiesActions'

let originalUuidV4 = uuid.v4
let originalNow = Date.now()

beforeAll(() => {
  uuid.v4 = () => 'uuid-v4'
  Date.now = () => new Date(2017, 9, 30, 8, 0).getTime()
})

afterAll(() => {
  uuid.v4 = originalUuidV4
  Date.now = originalNow
})

it("Story { type: 'story' } renders correctly", () => {
  const story = {
    id: 'story-id',
    type: 'story',
    title: 'Google',
    link: 'https://google.com',
    comments: [],
    votes: [],
    createdAt: new Date(0),
    createdBy: 'user-id',
    createdByName: 'user'
  }

  const wrapper = shallow(
    <Story
      story={story}
      loggedIn={true}
      voted={0}
      optimistic={{ votedStories: {} }}
    />
  )

  expect(wrapper).toMatchSnapshot()
})

it("Story { type: 'ask' } renders correctly", () => {
  const story = {
    id: 'story-id',
    type: 'ask',
    title: 'Ask HN: Google',
    text: 'Google',
    comments: [],
    votes: [],
    createdAt: new Date(0),
    createdBy: 'user-id',
    createdByName: 'user'
  }

  const wrapper = shallow(
    <Story
      story={story}
      loggedIn={true}
      voted={0}
      userId={'user-id'}
      optimistic={{ votedStories: {} }}
    />
  )

  expect(wrapper).toMatchSnapshot()
})

it("Story { type: 'ask' } renders correctly", () => {
  const story = {
    id: 'story-id',
    type: 'ask',
    title: 'Ask HN: Google',
    link: 'https://www.google.com',
    comments: [
      {
        id: 'comment-id',
        parentId: 'story-id',
        text: 'comment',
        createdAt: new Date(0),
        createdBy: 'user-id',
        createdByName: 'user'
      }
    ],
    votes: [],
    createdAt: new Date(0),
    createdBy: 'user-id',
    createdByName: 'user'
  }

  const wrapper = shallow(
    <Story
      story={story}
      loggedIn={true}
      voted={0}
      userId={'user-id'}
      optimistic={{ votedStories: {} }}
    />
  )

  wrapper.find(StoryInfo).shallow()

  expect(wrapper).toMatchSnapshot()
})

it('Story { commentCount: 1, text: "Text", showText: true } renders correctly', () => {
  const story = {
    id: 'story-id',
    type: 'ask',
    title: 'Ask HN: Google',
    link: 'https://www.google.com',
    commentCount: 1,
    votes: [],
    createdAt: new Date(0),
    createdBy: 'user-id',
    createdByName: 'user',
    text: 'Text'
  }

  const markup = shallow(
    <Story
      story={story}
      loggedIn={true}
      voted={0}
      userId={'user-id'}
      showText
      optimistic={{ votedStories: {} }}
    />
  )
  expect(markup).toMatchSnapshot()
})

it('Meta renders correctly', () => {
  const markup = shallow(
    <StoryInfo
      id={'story-id'}
      votes={['user-id']}
      voted={true}
      loggedIn={true}
      createdAt={new Date(0)}
      createdBy={'user-id'}
      createdByName={'user'}
      commentCount={0}
    />
  )

  expect(markup).toMatchSnapshot()
})

it('Meta renders correctly', () => {
  const markup = shallow(
    <StoryInfo
      id={'story-id'}
      voted={true}
      loggedIn={true}
      createdAt={new Date(0)}
      commentCount={0}
    />
  )

  expect(markup).toMatchSnapshot()
})

it('Title renders correctly', () => {
  const markup = shallow(
    <Title
      title={'Title'}
      link={'/story/story-id'}
      voted={true}
      loggedIn={true}
    />
  )

  expect(markup).toMatchSnapshot()
})

it('Title { external link } renders correctly', () => {
  const markup = shallow(
    <Title title={'Title'} link={'https://google.com'} loggedIn={true} />
  )

  expect(markup).toMatchSnapshot()
})

it('Title { external link with www } renders correctly', () => {
  const markup = shallow(
    <Title title={'Title'} link={'https://www.google.com'} loggedIn={true} />
  )

  expect(markup).toMatchSnapshot()
})

it('Upvote renders correctly', () => {
  const markup = shallow(<UpvoteArrow />)

  expect(markup).toMatchSnapshot()
})

it('Upvote { hidden: true} renders correctly', () => {
  const markup = shallow(<UpvoteArrow Upvote />)

  expect(markup).toMatchSnapshot()
})

it('getHostname renders correctly', () => {
  const markup = shallow(<getHostname link={'http://www.google.com'} />)

  expect(markup).toMatchSnapshot()
})

it('', () => {})

it('upvoteStory', () => {
  const story = {
    id: 'story-id',
    type: 'story',
    title: 'Google',
    link: 'https://google.com',
    comments: [],
    votes: [],
    createdAt: new Date(0),
    createdBy: 'user-id',
    createdByName: 'user'
  }

  const wrapper = shallow(
    <Story story={story} userId="user-id" optimistic={{ votedStories: {} }} />
  )
  let upvoteStory = false
  wrapper.setProps({
    upvoteStory: () => (upvoteStory = true),
    onVoted: () => {}
  })
  expect(upvoteStory).toEqual(false)
  wrapper
    .find(Title)
    .shallow()
    .find(UpvoteArrow)
    .simulate('click')
  expect(upvoteStory).toEqual(true)
})

it('unvoteStory', () => {
  const story = {
    id: 'story-id',
    type: 'story',
    title: 'Google',
    link: 'https://google.com',
    comments: [],
    votes: ['user-id'],
    createdAt: new Date(0),
    createdBy: 'user-id',
    createdByName: 'user'
  }

  const wrapper = shallow(
    <Story story={story} userId="user-id" optimistic={{ votedStories: {} }} />
  )
  let unvoteStory = false
  wrapper.setProps({
    unvoteStory: () => (unvoteStory = true),
    onVoted: () => {}
  })
  expect(unvoteStory).toEqual(false)

  wrapper
    .find(StoryInfo)
    .shallow()
    .find(UnvoteLink)
    .simulate('click')
  expect(unvoteStory).toEqual(true)
})

it('Invalid story', () => {
  const wrapper = shallow(
    <Story loggedIn={true} voted={1} optimistic={{ votedStories: {} }} />
  )
  expect(wrapper.find('.story')).toHaveLength(0)
})

it('mapStateToProps', () => {
  const optimistic = { votedStories: { id1: true, id2: false } }

  const props = mapStateToProps({ optimistic })

  expect(props).toEqual({ optimistic })
})

it('mapDispatchToProps upvoteStory', () => {
  const props = mapDispatchToProps(value => value)

  expect(props.upvoteStory('id')).toEqual(actions.upvoteStory('id'))
})

it('mapDispatchToProps unvoteStory', () => {
  const props = mapDispatchToProps(value => value)

  expect(props.unvoteStory('id')).toEqual(actions.unvoteStory('id'))
})

it('StyledLink', () => {
  const styledLink = shallow(<StyledLink to="/" />)

  expect(styledLink).toMatchSnapshot()
})
