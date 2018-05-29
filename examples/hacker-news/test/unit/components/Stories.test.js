import React from 'react'
import { shallow } from 'enzyme'

import Stories from '../../../client/components/Stories'

it('Stories first page renders correctly', () => {
  const items = [
    {
      id: 'story-id',
      type: 'story',
      title: 'title',
      link: 'https://google.com',
      commentCount: 0,
      votes: [],
      createdAt: new Date(0),
      createdBy: 'user-id',
      createdByName: 'user',
      upvoteStory: () => {},
      unvoteStory: () => {}
    }
  ]
  const wrapper = shallow(<Stories items={items} type={'story'} />)

  expect(wrapper).toMatchSnapshot()
})

it('Stories second page renders correctly', () => {
  const stories = []
  for (let i = 0; i < 50; i++) {
    stories.push({
      id: 'story-id' + i,
      type: 'story',
      title: 'title' + i,
      link: 'https://google.com',
      commentCount: 0,
      votes: [],
      createdAt: new Date(0),
      createdBy: 'user-id',
      createdByName: 'user',
      upvoteStory: () => {},
      unvoteStory: () => {}
    })
  }
  const wrapper = shallow(<Stories items={stories} page={2} type={'story'} />)

  expect(wrapper).toMatchSnapshot()
})

it('Stories page renders with error', () => {
  const stories = []

  const wrapper = shallow(
    <Stories
      items={stories}
      page="text"
      type={'story'}
      upvoteStory={() => {}}
      unvoteStory={() => {}}
    />
  )

  expect(wrapper).toMatchSnapshot()
})
