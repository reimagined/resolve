import React from 'react'
import { shallow } from 'enzyme'

import TimeAgo from '../../../client/components/TimeAgo'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const originalNow = Date.now

beforeAll(() => {
  Date.now = () => Date.UTC(2017, 10, 3)
})

afterAll(() => {
  Date.now = originalNow
})

it('TimeAgo less than a minute', () => {
  const timeAgo = shallow(<TimeAgo createdAt={Date.now() - SECOND} />)
  expect(timeAgo).toMatchSnapshot()
})

it('TimeAgo greater than a minute and less than an hour', () => {
  const timeAgo = shallow(<TimeAgo createdAt={Date.now() - MINUTE} />)
  expect(timeAgo).toMatchSnapshot()
})

it('TimeAgo greater than an hour and less than a day', () => {
  const timeAgo = shallow(<TimeAgo createdAt={Date.now() - HOUR} />)
  expect(timeAgo).toMatchSnapshot()
})

it('TimeAgo greater than a day', () => {
  const timeAgo = shallow(<TimeAgo createdAt={Date.now() - DAY} />)
  expect(timeAgo).toMatchSnapshot()
})
